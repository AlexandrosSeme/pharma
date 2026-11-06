import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import Supercluster from "supercluster";
import type { Customer } from "@/features/customers";
import type { GeoState } from "@/shared/hooks/useGeolocation";
import type { Coordinates } from "@/shared/lib/geo";
import { customerTypeStyle } from "../lib/customerTypeStyle";
import {
  circlePolygon,
  createMap,
  markerElement,
  setGeoJsonData,
  setMapLanguage,
  toLngLat,
} from "../lib/mapLibre";
import styles from "./CustomerMap.module.css";

export type MappedCustomer = Customer & Coordinates;

type CustomerMapProps = {
  customers: MappedCustomer[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  geo: GeoState;
  onLocate: () => void;
  /** Rendered over the bottom of the map, e.g. the selected customer's card. */
  overlay?: ReactNode;
};

type PointProps = { customerId: string };

const GREECE: [number, number] = [23.6, 38.6];
const FOCUS_ZOOM = 15;
const ACCURACY_SOURCE = "accuracy";

function markerClassName(customer: Customer, selected: boolean) {
  return [
    styles.marker,
    styles[customerTypeStyle[customer.type].className],
    customer.status === "inactive" && styles.inactive,
    selected && styles.selected,
  ]
    .filter(Boolean)
    .join(" ");
}

function pinContent(customer: Customer, selected: boolean) {
  const content = document.createElement("div");
  content.className = markerClassName(customer, selected);
  content.innerHTML = `<span class="${styles.pin}"><i class="bi ${customerTypeStyle[customer.type].icon}" aria-hidden="true"></i></span>`;
  return content;
}

function ensureAccuracyLayer(map: MapLibreMap, color: string) {
  if (map.getSource(ACCURACY_SOURCE)) return;
  map.addSource(ACCURACY_SOURCE, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
  });
  map.addLayer({
    id: "accuracy-fill",
    type: "fill",
    source: ACCURACY_SOURCE,
    paint: { "fill-color": color, "fill-opacity": 0.08 },
  });
  map.addLayer({
    id: "accuracy-line",
    type: "line",
    source: ACCURACY_SOURCE,
    paint: { "line-color": color, "line-opacity": 0.35, "line-width": 1 },
  });
}

export function CustomerMap({
  customers,
  selectedId,
  onSelect,
  geo,
  onLocate,
  overlay,
}: CustomerMapProps) {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const frameRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const indexRef = useRef<Supercluster<PointProps> | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const meRef = useRef<maplibregl.Marker | null>(null);
  const customersRef = useRef(customers);
  const selectedRef = useRef(selectedId);
  const centerOnNextFix = useRef(false);
  const language = i18n.resolvedLanguage ?? "en";
  const ready = status === "ready";
  const position = geo.status === "ready" ? geo.position : null;

  useEffect(() => {
    customersRef.current = customers;
    selectedRef.current = selectedId;
  });

  const select = useEffectEvent((id: string | null) => onSelect(id));
  const clusterTitle = useEffectEvent((count: number) =>
    t("map.cluster", { count }),
  );

  const clearMarkers = useEffectEvent(() => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  });

  const renderMarkers = useEffectEvent(() => {
    const map = mapRef.current;
    const index = indexRef.current;
    if (!map || !index) return;
    clearMarkers();
    const bounds = map.getBounds();
    if (!bounds) return;
    const zoom = Math.round(map.getZoom());
    const clusters = index.getClusters(
      [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ],
      zoom,
    );
    const byId = new Map(
      customersRef.current.map((customer) => [customer.id, customer]),
    );

    for (const feature of clusters) {
      const [lng, lat] = feature.geometry.coordinates;
      const props = feature.properties;
      if ("cluster" in props && props.cluster) {
        const count = props.point_count;
        const clusterId = props.cluster_id;
        const size = count < 10 ? 36 : count < 25 ? 42 : 48;
        const content = document.createElement("span");
        content.className = styles.cluster;
        content.style.width = content.style.height = `${size}px`;
        content.textContent = String(count);
        content.title = clusterTitle(count);
        content.addEventListener("click", (event) => {
          event.stopPropagation();
          const nextZoom = Math.min(
            index.getClusterExpansionZoom(clusterId),
            16,
          );
          map.easeTo({ center: [lng, lat], zoom: nextZoom });
        });
        markersRef.current.push(
          new maplibregl.Marker({
            element: markerElement(content),
            anchor: "bottom",
          })
            .setLngLat([lng, lat])
            .addTo(map),
        );
        continue;
      }

      const customer = byId.get(feature.properties.customerId);
      if (!customer) continue;
      const selected = customer.id === selectedRef.current;
      const content = pinContent(customer, selected);
      content.addEventListener("click", (event) => {
        event.stopPropagation();
        select(customer.id);
      });
      const marker = new maplibregl.Marker({
        element: markerElement(content),
        anchor: "bottom",
      })
        .setLngLat(toLngLat(customer))
        .addTo(map);
      marker.getElement().style.zIndex = selected ? "1000" : "";
      markersRef.current.push(marker);
    }
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let cancelled = false;

    const { map, loaded } = createMap({
      container,
      center: GREECE,
      zoom: 6,
      language,
    });
    mapRef.current = map;
    map.on("click", () => select(null));
    map.on("moveend", renderMarkers);

    loaded
      .then((readyMap) => {
        if (cancelled) return;
        const color =
          getComputedStyle(frameRef.current!)
            .getPropertyValue("--bs-primary")
            .trim() || "#1d4ed8";
        ensureAccuracyLayer(readyMap, color);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      clearMarkers();
      meRef.current?.remove();
      meRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [language]);

  useEffect(() => {
    const map = mapRef.current;
    if (ready && map) setMapLanguage(map, language);
  }, [ready, language]);

  function fitAll() {
    const map = mapRef.current;
    if (!map || !customersRef.current.length) return;
    const bounds = new maplibregl.LngLatBounds();
    customersRef.current.forEach((customer) =>
      bounds.extend(toLngLat(customer)),
    );
    map.fitBounds(bounds, { padding: 48, maxZoom: FOCUS_ZOOM, duration: 0 });
  }

  function focusOn(center: [number, number], zoomFloor = 14) {
    const map = mapRef.current;
    if (!map) return;
    const offset = Math.round((overlayRef.current?.offsetHeight ?? 0) / 2);
    map.easeTo({
      center,
      zoom: Math.max(map.getZoom(), zoomFloor),
      offset: [0, -offset],
    });
  }

  const visibleKey = customers.map((customer) => customer.id).join();
  useEffect(() => {
    if (!ready) return;
    const index = new Supercluster<PointProps>({ radius: 56, maxZoom: 14 });
    index.load(
      customersRef.current.map((customer) => ({
        type: "Feature" as const,
        properties: { customerId: customer.id },
        geometry: { type: "Point" as const, coordinates: toLngLat(customer) },
      })),
    );
    indexRef.current = index;
    renderMarkers();
    if (!selectedRef.current) fitAll();
  }, [ready, visibleKey]);

  useEffect(() => {
    if (!ready) return;
    renderMarkers();
    const customer = customersRef.current.find(
      (item) => item.id === selectedId,
    );
    if (!customer) return;
    const map = mapRef.current;
    focusOn(
      toLngLat(customer),
      map && map.getZoom() < 14 ? FOCUS_ZOOM : (map?.getZoom() ?? 14),
    );
  }, [ready, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    if (!position) {
      meRef.current?.remove();
      meRef.current = null;
      setGeoJsonData(map, ACCURACY_SOURCE, {
        type: "FeatureCollection",
        features: [],
      });
      return;
    }

    const color =
      getComputedStyle(frameRef.current!)
        .getPropertyValue("--bs-primary")
        .trim() || "#1d4ed8";
    setGeoJsonData(
      map,
      ACCURACY_SOURCE,
      circlePolygon(position, position.accuracy),
    );
    map.setPaintProperty("accuracy-fill", "fill-color", color);
    map.setPaintProperty("accuracy-line", "line-color", color);

    const center = toLngLat(position);
    if (meRef.current) {
      meRef.current.setLngLat(center);
    } else {
      const dot = document.createElement("span");
      dot.className = styles.me;
      meRef.current = new maplibregl.Marker({
        element: markerElement(dot),
        anchor: "bottom",
      })
        .setLngLat(center)
        .addTo(map);
      meRef.current.getElement().style.zIndex = "2000";
    }
    if (centerOnNextFix.current) {
      centerOnNextFix.current = false;
      focusOn(center);
    }
  }, [ready, position]);

  function locate() {
    if (position) return focusOn(toLngLat(position));
    centerOnNextFix.current = true;
    onLocate();
  }

  function zoomBy(delta: number) {
    const map = mapRef.current;
    if (map) map.zoomTo((map.getZoom() ?? 6) + delta);
  }

  return (
    <div ref={frameRef} className={styles.frame}>
      <div
        ref={containerRef}
        className={styles.map}
        role="region"
        aria-label={t("map.mapLabel")}
      />

      {!ready && (
        <div className={styles.state}>
          {status === "error" ? (
            <div className="text-center text-body-secondary" role="alert">
              <i className="bi bi-map fs-2 d-block mb-2" aria-hidden="true" />
              <p className="fw-semibold text-body-emphasis mb-1">
                {t("map.unavailable")}
              </p>
              <p className="small mb-0">{t("map.loadFailed")}</p>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2 text-body-secondary">
              <span
                className="spinner-border spinner-border-sm"
                aria-hidden="true"
              />
              {t("common.loading")}
            </div>
          )}
        </div>
      )}

      {ready && (
        <div className={styles.controls}>
          <div className={styles.zoomGroup}>
            <button
              type="button"
              className={`btn ${styles.control}`}
              title={t("map.zoomIn")}
              aria-label={t("map.zoomIn")}
              onClick={() => zoomBy(1)}
            >
              <i className="bi bi-plus-lg" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`btn ${styles.control}`}
              title={t("map.zoomOut")}
              aria-label={t("map.zoomOut")}
              onClick={() => zoomBy(-1)}
            >
              <i className="bi bi-dash-lg" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className={`btn ${styles.control}${position ? " active" : ""}`}
            title={t("map.locate")}
            aria-label={t("map.locate")}
            aria-pressed={!!position}
            onClick={locate}
          >
            {geo.status === "locating" ? (
              <span
                className="spinner-border spinner-border-sm"
                aria-hidden="true"
              />
            ) : (
              <i className="bi bi-crosshair" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className={`btn ${styles.control}`}
            title={t("map.fitAll")}
            aria-label={t("map.fitAll")}
            onClick={fitAll}
          >
            <i className="bi bi-arrows-fullscreen" aria-hidden="true" />
          </button>
        </div>
      )}

      {geo.status === "error" && (
        <div
          className={`alert alert-warning small py-2 px-3 mb-0 ${styles.notice}`}
          role="alert"
        >
          {t(`location.errors.${geo.error}`)}
        </div>
      )}

      <div ref={overlayRef} className={styles.overlay}>
        {ready && overlay}
      </div>
    </div>
  );
}
