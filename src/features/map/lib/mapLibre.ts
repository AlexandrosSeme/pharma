import * as maplibregl from "maplibre-gl";
import type {
  ErrorEvent,
  ExpressionSpecification,
  LngLatLike,
  Map as MapLibreMap,
} from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?url";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Coordinates } from "@/shared/lib/geo";

// Vite's prebundle leaves MapLibre's worker URL empty, so tiles never start.
maplibregl.setWorkerUrl(workerUrl);

/** OpenFreeMap: free OpenStreetMap vector tiles, no key or account. Any MapLibre style URL works here. */
export const MAP_STYLE_URL =
  import.meta.env.VITE_MAP_STYLE_URL ||
  "https://tiles.openfreemap.org/styles/liberty";

export const toLngLat = (c: Coordinates): [number, number] => [
  c.longitude,
  c.latitude,
];

/** MapLibre's source union does not narrow `setData`, so update GeoJSON through this. */
export function setGeoJsonData(
  map: MapLibreMap,
  sourceId: string,
  data: GeoJSON.GeoJSON,
) {
  const source = map.getSource(sourceId) as
    | { type?: string; setData?: (next: GeoJSON.GeoJSON) => void }
    | undefined;
  if (source?.type === "geojson") source.setData?.(data);
}

type CreateMapOptions = {
  container: HTMLElement;
  center: LngLatLike;
  zoom: number;
  language: string;
};

/** Resolves once the style has loaded, so sources and layers can be added right away. */
export function createMap({
  container,
  center,
  zoom,
  language,
}: CreateMapOptions) {
  const map = new maplibregl.Map({
    container,
    style: MAP_STYLE_URL,
    center,
    zoom,
    attributionControl: { compact: true },
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
  });
  map.touchZoomRotate.disableRotation();

  const loaded = new Promise<MapLibreMap>((resolve, reject) => {
    // Tile, glyph and sprite misses also raise `error`. Only a style that never loads is fatal.
    const failed = (event: ErrorEvent) => {
      if (map.isStyleLoaded() || map.loaded()) return;
      const message = event.error?.message ?? "";
      if (/tile|glyph|sprite|image|ajax/i.test(message)) return;
      reject(event.error ?? new Error("The map style could not be loaded"));
    };
    map.on("error", failed);
    map.once("load", () => {
      map.off("error", failed);
      try {
        setMapLanguage(map, language);
      } catch {
        // Labels keep the style's own language if a layer rejects the override.
      }
      map.resize();
      resolve(map);
    });
  });
  return { map, loaded };
}

/** Place names follow the app language, falling back to the local (Greek) name. */
export function setMapLanguage(map: MapLibreMap, language: string) {
  const lang = language.startsWith("el") ? "el" : "en";
  const label =
    lang === "el"
      ? ["coalesce", ["get", "name:el"], ["get", "name"]]
      : [
          "coalesce",
          ["get", "name:en"],
          ["get", "name_en"],
          ["get", "name:latin"],
          ["get", "name"],
        ];
  for (const layer of map.getStyle().layers) {
    if (layer.type !== "symbol") continue;
    const field = map.getLayoutProperty(layer.id, "text-field");
    if (field && JSON.stringify(field).includes('"name')) {
      map.setLayoutProperty(
        layer.id,
        "text-field",
        label as ExpressionSpecification,
      );
    }
  }
}

/** Wraps marker content: MapLibre positions the outer element with an inline transform, so CSS transforms go on the inner one. */
export function markerElement(content: HTMLElement) {
  const element = document.createElement("div");
  element.appendChild(content);
  return element;
}

/** A circle of `radius` meters around `center`, as a GeoJSON polygon for the accuracy halo. */
export function circlePolygon(
  center: Coordinates,
  radius: number,
  steps = 64,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const lat = (center.latitude * Math.PI) / 180;
  const dLat = radius / 111320;
  const dLng = radius / (111320 * Math.cos(lat));
  const ring = Array.from({ length: steps + 1 }, (_, i) => {
    const angle = (i / steps) * 2 * Math.PI;
    return [
      center.longitude + dLng * Math.cos(angle),
      center.latitude + dLat * Math.sin(angle),
    ];
  });
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: [ring] },
  };
}
