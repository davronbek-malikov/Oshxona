"use client";

import { useEffect, useRef } from "react";

interface Restaurant {
  id: string;
  name_uz: string;
  lat: number;
  lng: number;
  distance_km?: number;
}

interface Props {
  restaurants: Restaurant[];
  userLat: number;
  userLng: number;
  onSelect?: (id: string) => void;
}

export default function RestaurantMap({
  restaurants,
  userLat,
  userLng,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const map = L.map(containerRef.current).setView([userLat, userLng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // User location marker (orange circle)
    L.circleMarker([userLat, userLng], {
      radius: 8,
      color: "#F97316",
      fillColor: "#F97316",
      fillOpacity: 0.8,
    })
      .addTo(map)
      .bindPopup("Siz shu yerdasiz");

    // Restaurant markers
    restaurants.forEach((r) => {
      const marker = L.marker([r.lat, r.lng])
        .addTo(map)
        .bindPopup(
          `<b>${r.name_uz}</b>${r.distance_km !== undefined ? `<br>${r.distance_km.toFixed(1)} km` : ""}<br><a href="/menu/${r.id}" style="color:#F97316;font-weight:600;">Menyuni ko'rish →</a>`
        );

      if (onSelect) {
        marker.on("click", () => onSelect(r.id));
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={containerRef}
        style={{ height: "calc(100vh - 200px)", width: "100%", zIndex: 0 }}
        className="rounded-2xl overflow-hidden"
      />
    </>
  );
}
