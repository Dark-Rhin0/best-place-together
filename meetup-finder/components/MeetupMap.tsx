"use client";

import { filterValidPlaces, geometricCenter } from "@/lib/geo";
import { places } from "@/data/places";

export default function MapClient() {
  const users = [
    { lat: 21.0285, lng: 105.8542 },
    { lat: 21.0228, lng: 105.8194 },
    { lat: 21.0362, lng: 105.8338 },
  ];

  const center = geometricCenter(users);

  const validPlaces = filterValidPlaces(
    users,
    places.map((p) => ({ lat: p.lat, lng: p.lng }))
  );

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl font-bold mb-4">
        Tìm địa điểm gặp mặt tối ưu
      </h1>

      <div className="mb-4">
        <strong>Điểm gặp trung tâm đề xuất:</strong>
        <div>Lat: {center.lat.toFixed(5)}</div>
        <div>Lng: {center.lng.toFixed(5)}</div>
      </div>

      <h2 className="font-semibold mb-2">
        Địa điểm phù hợp để gặp nhau
      </h2>

      {validPlaces.length === 0 && (
        <p>Không có địa điểm nào thỏa điều kiện</p>
      )}
    </div>
  );
}
