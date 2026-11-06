import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import type { ActivityType } from "@/features/calendar";
import {
  createMap,
  markerElement,
  setGeoJsonData,
  setMapLanguage,
} from "@/features/map/lib/mapLibre";
import type { RouteStop } from "../hooks/useRepHome";
import styles from "./RouteMap.module.css";

const ATHENS: [number, number] = [23.73, 37.98];
const pinKinds: ActivityType[] = ["visit", "call", "meeting", "task"];
const ROUTE_SOURCE = "route";

type LngLat = { lng: number; lat: number };

type RouteMapProps = {
  stops: RouteStop[];
  isLoading: boolean;
};

function signatureOf(stops: RouteStop[]) {
  return stops
    .map(
      (stop) =>
        `${stop.id}:${stop.order}:${stop.latitude}:${stop.longitude}:${stop.kind}:${stop.done ? 1 : 0}`,
    )
    .join("|");
}

function distanceToSegment(point: LngLat, from: LngLat, to: LngLat) {
  const dx = to.lng - from.lng;
  const dy = to.lat - from.lat;
  const len2 = dx * dx + dy * dy || 1;
  const t = Math.min(
    1,
    Math.max(
      0,
      ((point.lng - from.lng) * dx + (point.lat - from.lat) * dy) / len2,
    ),
  );
  return Math.hypot(
    from.lng + t * dx - point.lng,
    from.lat + t * dy - point.lat,
  );
}

/** A finished leg that runs back over a road still ahead needs to sit beside it. */
function doublesBack(from: LngLat, to: LngLat, path: LngLat[], index: number) {
  for (let next = index + 1; next < path.length - 1; next += 1) {
    const mid = {
      lat: (path[next].lat + path[next + 1].lat) / 2,
      lng: (path[next].lng + path[next + 1].lng) / 2,
    };
    if (distanceToSegment(mid, from, to) < 0.012) return true;
  }
  return false;
}

/** Pull a finished leg off the road still ahead, so the gray line stays visible when the route doubles back. */
function bow(from: LngLat, to: LngLat): LngLat[] {
  const dx = to.lng - from.lng;
  const dy = to.lat - from.lat;
  const len = Math.hypot(dx, dy) || 1;
  const shift = Math.min(0.015, len * 0.22);
  return [
    from,
    {
      lat: (from.lat + to.lat) / 2 + (dx / len) * shift,
      lng: (from.lng + to.lng) / 2 + (-dy / len) * shift,
    },
    to,
  ];
}

/** Same address twice would stack the numbers, so later stops step aside. */
function place(stops: RouteStop[]) {
  const seen = new Map<string, number>();
  return stops.map((stop) => {
    const key = `${stop.latitude.toFixed(5)},${stop.longitude.toFixed(5)}`;
    const n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    if (n === 0) return stop;
    return {
      ...stop,
      latitude: stop.latitude + 0.004 * n,
      longitude: stop.longitude + 0.004 * n,
    };
  });
}

function toLngLat(stop: RouteStop): [number, number] {
  return [stop.longitude, stop.latitude];
}

function ensureRouteLayers(map: MapLibreMap, stroke: string) {
  if (map.getSource(ROUTE_SOURCE)) return;
  map.addSource(ROUTE_SOURCE, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addLayer({
    id: "route-next",
    type: "line",
    source: ROUTE_SOURCE,
    filter: ["!=", ["get", "covered"], true],
    paint: { "line-color": stroke, "line-width": 4, "line-opacity": 1 },
  });
  map.addLayer({
    id: "route-done",
    type: "line",
    source: ROUTE_SOURCE,
    filter: ["==", ["get", "covered"], true],
    paint: { "line-color": "#64748b", "line-width": 5, "line-opacity": 1 },
  });
}

export function RouteMap({ stops, isLoading }: RouteMapProps) {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const signature = signatureOf(stops);
  const language = i18n.resolvedLanguage ?? "en";
  const hasDone = stops.some((stop) => stop.done);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;
    const { map, loaded } = createMap({
      container,
      center: ATHENS,
      zoom: 11,
      language,
    });
    mapRef.current = map;

    loaded
      .then((readyMap) => {
        if (cancelled) return;
        const stroke =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--bs-primary")
            .trim() || "#1d4ed8";
        ensureRouteLayers(readyMap, stroke);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [language]);

  useEffect(() => {
    const map = mapRef.current;
    if (status === "ready" && map) setMapLanguage(map, language);
  }, [status, language]);

  useEffect(() => {
    const map = mapRef.current;
    if (status !== "ready" || !map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const placed = place(stops);
    if (!placed.length) {
      setGeoJsonData(map, ROUTE_SOURCE, {
        type: "FeatureCollection",
        features: [],
      });
      return;
    }

    const stroke =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--bs-primary")
        .trim() || "#1d4ed8";
    map.setPaintProperty("route-next", "line-color", stroke);

    const path: LngLat[] = placed.map((stop) => ({
      lat: stop.latitude,
      lng: stop.longitude,
    }));
    const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
    for (let index = 0; index < path.length - 1; index += 1) {
      const covered = placed[index + 1].done;
      const from = path[index];
      const to = path[index + 1];
      const leg =
        covered && doublesBack(from, to, path, index)
          ? bow(from, to)
          : [from, to];
      features.push({
        type: "Feature",
        properties: { covered },
        geometry: {
          type: "LineString",
          coordinates: leg.map((point) => [point.lng, point.lat]),
        },
      });
    }
    setGeoJsonData(map, ROUTE_SOURCE, { type: "FeatureCollection", features });

    const bounds = new maplibregl.LngLatBounds();
    for (const stop of placed) {
      const position = toLngLat(stop);
      bounds.extend(position);
      const content = document.createElement("div");
      content.className = [
        styles.pin,
        styles[stop.kind],
        stop.done ? styles.done : "",
      ]
        .filter(Boolean)
        .join(" ");
      content.textContent = String(stop.order);
      const marker = new maplibregl.Marker({
        element: markerElement(content),
        anchor: "bottom",
      })
        .setLngLat(position)
        .addTo(map);
      marker.getElement().style.zIndex = String(100 + stop.order);
      marker.getElement().title = `${stop.order}. ${stop.name}`;
      markersRef.current.push(marker);
    }
    features.forEach((feature) =>
      feature.geometry.coordinates.forEach((point) =>
        bounds.extend(point as [number, number]),
      ),
    );

    if (placed.length === 1) {
      map.jumpTo({ center: toLngLat(placed[0]), zoom: 14 });
      return;
    }
    map.fitBounds(bounds, { padding: 64, duration: 0 });
  }, [status, signature, stops]);

  return (
    <div>
      <div className={styles.frame}>
        <div
          ref={containerRef}
          className={styles.map}
          role="img"
          aria-label={t("dashboard.mapTitle")}
        />
        {(isLoading || status === "loading") && (
          <p className={styles.message}>
            <span
              className="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />
            {t("common.loading")}
          </p>
        )}
        {!isLoading && status === "error" && (
          <p className={styles.message}>{t("dashboard.mapMissing")}</p>
        )}
        {!isLoading && status === "ready" && stops.length === 0 && (
          <p className={styles.message}>{t("dashboard.mapEmpty")}</p>
        )}
        {status === "ready" && stops.length > 0 && (
          <p className={styles.legend}>
            {pinKinds.map(
              (kind) =>
                stops.some((stop) => stop.kind === kind && !stop.done) && (
                  <span key={kind}>
                    <i className={`${styles.swatch} ${styles[kind]}`} />{" "}
                    {t(`calendar.types.${kind}`)}
                  </span>
                ),
            )}
            {hasDone && (
              <span>
                <i className={`${styles.swatch} ${styles.done}`} />{" "}
                {t("dashboard.mapDone")}
              </span>
            )}
          </p>
        )}
      </div>
      {status === "ready" && stops.length > 0 && (
        <p className={styles.hint}>{t("dashboard.mapHint")}</p>
      )}
    </div>
  );
}
