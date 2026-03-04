"use client";

import dynamic from "next/dynamic";
import { useState, useMemo } from "react";
import { optimalMeetingPoint } from "@/lib/geo";
import AddressInput from "./AddressInput";
import { findPlacesAround } from "@/lib/overpass";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
});

type User = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
};

type Place = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  address?: string;
};

/* =========================
   VALIDATION LOGIC
   ========================= */
function isValidPlace(p: Place): boolean {
  if (!p.name || p.name.trim().length === 0) return false;
  if (!p.address) return false;

  const addr = p.address.trim().toLowerCase();

  const invalid = ["unknown", "n/a", "null", "undefined", "-"];
  if (invalid.includes(addr)) return false;

  if (addr.length < 6) return false;

  const hasStructure = addr.includes(",") || /\d/.test(addr);
  if (!hasStructure) return false;

  return true;
}

export default function MapClient() {
  /* =========================
     STATE
     ========================= */
  const [users, setUsers] = useState<User[]>([
    {
      id: crypto.randomUUID(),
      name: "Thành viên 1",
      lat: 10.8169,
      lng: 106.60383,
    },
    {
      id: crypto.randomUUID(),
      name: "Thành viên 2",
      lat: 10.86822,
      lng: 106.61484,
    },
  ]);

  const [places, setPlaces] = useState<Place[]>([]);
  const [placeType, setPlaceType] =
    useState<"cafe" | "restaurant" | "sports" | "cinema">("cafe");
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [showAll, setShowAll] = useState(false);

  /* =========================
     CORE LOGIC
     ========================= */

  const center = optimalMeetingPoint(users);

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

  function suggestedRadius(users: User[]) {
    let maxDistance = 0;

    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const d = distance(users[i], users[j]);
        maxDistance = Math.max(maxDistance, d);
      }
    }

    const radius = maxDistance * 0.5;

    return Math.min(Math.max(radius, 800), 12000);
  }

  function addUser(u: Omit<User, "id" | "name">) {
    setUsers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Thành viên ${prev.length + 1}`,
        ...u,
      },
    ]);
  }

  function removeUser(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  function updateUserName(id: string, name: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, name } : u))
    );
  }

  async function loadCommunityPlaces() {
    const res = await fetch(
      `/api/community-places?lat=${center.lat}&lng=${center.lng}&radius=5000`
    );

    const data = await res.json();
    setPlaces(data);
  }

  /* =========================
     SEARCH PLACES
     ========================= */
  async function searchPlaces() {
    if (users.length === 0) return;

    setLoadingPlaces(true);

    try {
      const currentCenter = optimalMeetingPoint(users);
      const radius = suggestedRadius(users);

      const result = await findPlacesAround(
        currentCenter.lat,
        currentCenter.lng,
        Math.round(radius),
        placeType
      );

      setPlaces(result);
    } finally {
      setLoadingPlaces(false);
    }
  }

  /* =========================
     RANKING LOGIC
     ========================= */

  /* =========================
   RANKING LOGIC (OPTIMIZED)
   ========================= */

const rankedPlaces = useMemo(() => {
  if (places.length === 0) return [];

  return places
    //.filter(isValidPlace) // bật lại nếu cần
    .map((p) => ({
      ...p,
      totalDistance: users.reduce(
        (sum, u) => sum + distance(u, p),
        0
      ),
    }));
}, [places, users]);

const displayedPlaces = useMemo(() => {
  if (rankedPlaces.length === 0) return [];

  // Nếu chỉ cần top 5 → không cần giữ thứ tự gốc
  const sorted = [...rankedPlaces].sort(
    (a, b) => a.totalDistance - b.totalDistance
  );

  return showAll ? sorted : sorted.slice(0, 5);
}, [rankedPlaces, showAll]);

  /* =========================
     UI
     ========================= */

  return (
    <div className="space-y-4 p-4">
      <AddressInput onAddUser={addUser} />

      <div className="flex gap-2 items-center">
        <select
          value={placeType}
          onChange={(e) => setPlaceType(e.target.value as any)}
          className="p-2 rounded border"
        >
          <option value="cafe">☕ Quán cà phê</option>
          <option value="restaurant">🍽 Nhà hàng</option>
          <option value="sports">⚽ Sân bóng</option>
          <option value="cinema">🎬 Rạp chiếu phim</option>
        </select>

        <button
          onClick={searchPlaces}
          disabled={loadingPlaces}
          className={`px-4 py-2 rounded text-white ${
            loadingPlaces ? "bg-gray-400" : "bg-green-600"
          }`}
        >
          {loadingPlaces
            ? "🔍 Tìm kiếm..."
            : "Tìm địa điểm gần điểm gặp"}
        </button>
      </div>

      {/* MAP — QUAN TRỌNG: dùng displayedPlaces */}
      <MapView
        users={users}
        center={center}
        places={displayedPlaces}
      />

      {rankedPlaces.length > 0 && (
        <div>
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {showAll
              ? "Hiển thị Top 5 tốt nhất"
              : "Hiển thị toàn bộ địa điểm"}
          </button>
        </div>
      )}

      {rankedPlaces.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-lg">
            Địa điểm đề xuất theo tối ưu khoảng cách
          </h2>

          {displayedPlaces.map((p, index) => (
            <div
              key={p.id}
              className="border p-2 rounded"
            >
              <div className="font-medium">
                #{index + 1} {p.name}
              </div>

              <div className="text-sm text-gray-600">
                {p.address}
              </div>

              <div className="text-sm text-gray-500">
                Tổng khoảng cách:{" "}
                {(p.totalDistance / 1000).toFixed(2)} km
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h2 className="font-semibold text-lg">
          Danh sách địa chỉ đã thêm
        </h2>

        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-2 border p-2 rounded"
          >
            <input
              value={u.name}
              onChange={(e) =>
                updateUserName(u.id, e.target.value)
              }
              className="border px-2 py-1 rounded w-32"
            />

            <div className="text-sm text-gray-600 flex-1">
              {u.address ??
                `Lat: ${u.lat.toFixed(5)}, Lng: ${u.lng.toFixed(
                  5
                )}`}
            </div>

            <button
              onClick={() => removeUser(u.id)}
              disabled={users.length === 1}
              className={
                users.length === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-red-600"
              }
            >
              Xóa
            </button>
          </div>
        ))}

        {!loadingPlaces && places.length === 0 && (
          <div className="text-sm text-gray-500">
            Không tìm thấy địa điểm phù hợp quanh
            điểm gặp. Hãy thử đổi loại địa điểm
            hoặc khu vực khác.
          </div>
        )}
      </div>
    </div>
  );
}
