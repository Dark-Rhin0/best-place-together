"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
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
   VALIDATION LOGIC (QUAN TRỌNG)
   ========================= */
function isValidPlace(p: Place): boolean {
  // phải có tên
  if (!p.name || p.name.trim().length === 0) return false;

  const addr = p.address.trim().toLowerCase();

  // loại address rác / placeholder
  const invalid = ["unknown", "n/a", "null", "undefined", "-"];
  if (invalid.includes(addr)) return false;

  // address quá ngắn → không có giá trị hiển thị
  if (addr.length < 6) return false;

  // address nên có cấu trúc (có số nhà hoặc dấu ,)
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

  /* =========================
     LOGIC
     ========================= */
  const center = optimalMeetingPoint(users);

  // tính khoảng cách giữa các điểm (m)
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

    // bán kính = 30% khoảng cách xa nhất
    const radius = maxDistance * 0.5;

    // giới hạn an toàn
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
     SEARCH PLACES (ỔN ĐỊNH)
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

        const filtered = result.filter(
        (p) =>
            p.name &&
            p.name.trim() !== "" &&
            p.address &&
            p.address.trim() !== ""
        );

        setPlaces(filtered);
    } finally {
        setLoadingPlaces(false);
    }
  }

  /* =========================
     UI
     ========================= */
  return (
    <div className="space-y-4 p-4">
      {/* Nhập địa chỉ */}
      <AddressInput onAddUser={addUser} />

      {/* Chọn loại địa điểm */}
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
          {loadingPlaces ? "🔍 Tìm kiếm..." : "Tìm địa điểm gần điểm gặp"}
        </button>
      </div>

      {/* MAP */}
      <MapView users={users} center={center} places={places} />

      {/* DANH SÁCH ĐỊA CHỈ */}
      <div className="space-y-2">
        <h2 className="font-semibold text-lg">Danh sách địa chỉ đã thêm</h2>

        {users.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-2 border p-2 rounded"
          >
            <input
              value={u.name}
              onChange={(e) => updateUserName(u.id, e.target.value)}
              className="border px-2 py-1 rounded w-32"
            />

            <div className="text-sm text-gray-600 flex-1">
              {u.address ??
                `Lat: ${u.lat.toFixed(5)}, Lng: ${u.lng.toFixed(5)}`}
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
            Không tìm thấy địa điểm phù hợp quanh điểm gặp.  
            Hãy thử tăng số người, đổi loại địa điểm hoặc khu vực khác.
          </div>
        )}
      </div>
    </div>
  );
}
