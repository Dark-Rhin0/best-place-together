"use client";

import { geometricCenter } from "@/lib/geo";
import { places } from "@/data/places";

type Point = {
  lat: number;
  lng: number;
};

function distance(a: Point, b: Point) {
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

export default function MapClient() {
  const users: Point[] = [
    { lat: 21.0285, lng: 105.8542 },
    { lat: 21.0228, lng: 105.8194 },
    { lat: 21.0362, lng: 105.8338 },
  ];

  const center = geometricCenter(users);

  const MAX_DISTANCE_PER_USER = 5000; // 5km

  const evaluatedPlaces = places.map((p) => {
    const distances = users.map((u) => distance(u, p));

    const totalDistance = distances.reduce(
      (sum, d) => sum + d,
      0
    );

    const maxDistance = Math.max(...distances);

    return {
      ...p,
      totalDistance,
      maxDistance,
    };
  });

  // 🔥 Chỉ giữ địa điểm mà không ai phải đi quá 5km
  const validPlaces = evaluatedPlaces
    .filter((p) => p.maxDistance <= MAX_DISTANCE_PER_USER)
    .sort((a, b) => a.totalDistance - b.totalDistance);

  return (
    <div className="p-6 text-white space-y-6">
      <h1 className="text-xl font-bold">
        Tìm địa điểm
      </h1>

      <div className="bg-gray-800 p-4 rounded">
        <strong>Điểm gặp trung tâm đề xuất:</strong>
        <div>Lat: {center.lat.toFixed(5)}</div>
        <div>Lng: {center.lng.toFixed(5)}</div>
      </div>

      <div>
        <h2 className="font-semibold mb-2">
          Địa điểm phù hợp (mỗi người ≤ 5km)
        </h2>

        {validPlaces.length === 0 && (
          <div className="bg-red-900 p-3 rounded text-red-300">
            ❌ Không tìm thấy địa điểm nào phù hợp trong
            phạm vi 5km cho tất cả mọi người.
          </div>
        )}

        {validPlaces.length > 0 && (
          <div className="space-y-3">
            {validPlaces.map((p, index) => (
              <div
                key={p.id}
                className="bg-gray-800 p-3 rounded"
              >
                <div className="font-medium">
                  #{index + 1} {p.name}
                </div>

                <div className="text-sm text-gray-400">
                  Tổng khoảng cách:{" "}
                  {(p.totalDistance / 1000).toFixed(2)} km
                </div>

                <div className="text-sm text-gray-500">
                  Người xa nhất phải đi:{" "}
                  {(p.maxDistance / 1000).toFixed(2)} km
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}