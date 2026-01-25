"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

/* ===================== TYPES ===================== */

type User = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type Place = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  address?: string;
};

type Props = {
  users: User[];
  places: Place[];
  center: { lat: number; lng: number };
};

/* ===================== AUTO FIT ===================== */

function AutoFit({
  users,
  places,
}: {
  users: User[];
  places: Place[];
}) {
  const map = useMap();

  useEffect(() => {
    const points: [number, number][] = [
      ...users.map((u) => [u.lat, u.lng]),
      ...places.map((p) => [p.lat, p.lng]),
    ];

    if (points.length === 0) return;

    const bounds = L.latLngBounds(points);

    if (points.length === 1) {
      map.setView(points[0], 14);
    } else {
      map.fitBounds(bounds, {
        padding: [50, 50],
        animate: true,
      });
    }
  }, [users, places, map]);

  return null;
}

/* ===================== DISTANCE ===================== */

function distance(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const R = 6371e3;
  const φ1 = (a.lat * Math.PI) / 180;
  const φ2 = (b.lat * Math.PI) / 180;
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180;
  const Δλ = ((b.lng - a.lng) * Math.PI) / 180;

  const x =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) *
      Math.cos(φ2) *
      Math.sin(Δλ / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/* ===================== ICON FIX ===================== */

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/* ===================== CUSTOM ICONS ===================== */

const redIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const yellowIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

/* ===================== MAP VIEW ===================== */

export default function MapView({
  users,
  places,
  center,
}: Props) {
  const nearestPlace =
    places.length > 0
      ? places.reduce((a, b) =>
          distance(center, a) < distance(center, b) ? a : b
        )
      : null;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={14}
      className="h-[400px] w-full rounded"
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <AutoFit users={users} places={places} />

      {/* USERS */}
      {users.map((u) => (
        <Marker key={u.id} position={[u.lat, u.lng]}>
          <Popup>
            <strong>{u.name}</strong>
          </Popup>
        </Marker>
      ))}

      {/* CENTER */}
      <Marker position={[center.lat, center.lng]} icon={yellowIcon}>
        <Popup>📍 Điểm gặp tối ưu</Popup>
      </Marker>

      {/* PLACES */}
      {places.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={redIcon}>
          <Popup>
            <div className="font-semibold">
              {p.name} {nearestPlace?.id === p.id && "⭐ Tốt nhất!"}
            </div>

            {p.address && (
              <div className="text-sm text-gray-600">
                {p.address}
              </div>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
