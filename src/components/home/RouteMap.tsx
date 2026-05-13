"use client";

import { useEffect, useRef } from "react";

export interface RouteMapPort {
  /** [lat, lon] */
  latlng: [number, number];
  name: string;
  /** Hex color for the marker (origin gets origin's flag color, destination gets gold). */
  color: string;
  /** Leaflet tooltip direction. */
  dir?: "top" | "bottom" | "left" | "right" | "center";
  /** Pixel offset for the tooltip from the marker. */
  offset?: [number, number];
}

export interface RouteMapVia {
  latlng: [number, number];
  name: string;
  dir?: "top" | "bottom" | "left" | "right" | "center";
  offset?: [number, number];
}

export interface RouteMapConfig {
  /** Two corner [lat, lon] pairs to frame the route on the map. */
  bounds: [[number, number], [number, number]];
  /** Polyline of [lat, lon] waypoints. */
  route: [number, number][];
  ports: RouteMapPort[];
  via?: RouteMapVia[];
  /** Big centered distance pill — e.g. "≈ 22,000 KM · 60 D". */
  distance?: { latlng: [number, number]; text: string };
}

const TILE_URL = "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";
const TILE_ATTR = "&copy; OpenStreetMap &copy; CARTO";
const SUBDOMAINS = "abcd";

/**
 * Renders a single trade-lane on a real-world map basemap. Leaflet is
 * imported dynamically so it never touches the server bundle, and the
 * map's tile pane is filtered to a desaturated gold/bone tint via
 * the surrounding `.route__map--leaflet` CSS so it reads as part of
 * the editorial design rather than a generic web map.
 */
export default function RouteMap({ id, config }: { id: string; config: RouteMapConfig }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    let mapInstance: { remove: () => void } | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      // Load Leaflet's stylesheet once globally. We dynamic-import the
      // CSS so it doesn't end up in the server bundle.
      if (typeof document !== "undefined" && !document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        link.crossOrigin = "";
        document.head.appendChild(link);
      }
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: true,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
      });
      mapInstance = map;

      L.tileLayer(TILE_URL, {
        attribution: TILE_ATTR,
        subdomains: SUBDOMAINS,
        maxZoom: 8,
      }).addTo(map);

      map.fitBounds(config.bounds, { padding: [18, 18] });

      L.polyline(config.route, {
        color: "#C9A84C",
        weight: 2.4,
        opacity: 0.95,
        dashArray: "6 5",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      for (const p of config.ports) {
        L.circleMarker(p.latlng, {
          radius: 5,
          color: p.color,
          weight: 2,
          fillColor: p.color,
          fillOpacity: 1,
        }).addTo(map);
        L.marker(p.latlng, { opacity: 0, interactive: false })
          .addTo(map)
          .bindTooltip(p.name, {
            permanent: true,
            direction: p.dir ?? "top",
            offset: p.offset ?? [0, -6],
            className: "lane-port-tip",
          });
      }

      for (const v of config.via ?? []) {
        L.marker(v.latlng, { opacity: 0, interactive: false })
          .addTo(map)
          .bindTooltip(v.name, {
            permanent: true,
            direction: v.dir ?? "right",
            offset: v.offset ?? [6, 0],
            className: "lane-via-tip",
          });
      }

      if (config.distance) {
        L.marker(config.distance.latlng, { opacity: 0, interactive: false })
          .addTo(map)
          .bindTooltip(config.distance.text, {
            permanent: true,
            direction: "center",
            offset: [0, 0],
            className: "lane-distance-tip",
          });
      }
    })();

    return () => {
      cancelled = true;
      mapInstance?.remove();
    };
  }, [config]);

  return (
    <div
      ref={containerRef}
      id={id}
      className="route__map route__map--leaflet"
      aria-hidden="true"
    />
  );
}
