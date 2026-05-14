"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useRef } from "react";
import { optimalMeetingPoint } from "@/lib/geo";
import AddressInput from "./AddressInput";
import { findPlacesAround } from "@/lib/overpass";
import "./MapClient.css";

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
  if (!p.name) return false;

  const name = p.name.trim().toLowerCase();

  if (name.length === 0) return false;

  const invalidNames = [
    "unknown",
    "unnamed",
    "n/a",
    "null",
    "-",
    "yes",
  ];

  return !invalidNames.includes(name);
}

/* =========================
   DISTANCE FUNCTION
========================= */
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

export default function MapClient() {
  /* =========================
     STATE
  ========================= */

  const [users, setUsers] = useState<User[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [placeType, setPlaceType] = useState<"cafe" | "restaurant" | "sports" | "cinema">("cafe");
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /* =========================
     DEFAULT MAP CENTER
  ========================= */

  const defaultCenter = {
    lat: 10.8231,
    lng: 106.6297,
  };

  /* =========================
     OPTIMAL CENTER
  ========================= */

  const center =
    users.length > 0
      ? optimalMeetingPoint(users)
      : defaultCenter;

  /* =========================
     RADIUS SUGGESTION
  ========================= */

  function suggestedRadius(users: User[]) {
    let maxDistance = 0;

    for (let i = 0; i < users.length; i++) {
      for (
        let j = i + 1;
        j < users.length;
        j++
      ) {
        const d = distance(
          users[i],
          users[j]
        );

        maxDistance = Math.max(
          maxDistance,
          d
        );
      }
    }

    const radius = maxDistance * 0.9;

    return Math.min(
      Math.max(radius, 800),
      12000
    );
  }

  /* =========================
     USER FUNCTIONS
  ========================= */

  function addUser(
    u: Omit<User, "id" | "name">
  ) {
    setUsers((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `Thành viên ${prev.length + 1
          }`,
        ...u,
      },
    ]);
  }

  const addTestUsers = () => {
    const testUsers: User[] = [
      {
        id: crypto.randomUUID(),
        name: "Thành viên 1",
        lat: 10.8169,
        lng: 106.60383,
        address: "81, Bumgarner Drive, Landmark, Forest, Campbeltown, Scotland, PA12 6BH"
      },
      {
        id: crypto.randomUUID(),
        name: "Thành viên 2",
        lat: 10.86822,
        lng: 106.61484,
        address: "District 12, Ho Chi Minh City"
      },
    ];

    setUsers(testUsers);
  };

  function removeUser(id: string) {
    setUsers((prev) =>
      prev.filter((u) => u.id !== id)
    );
  }

  function updateUserName(
    id: string,
    name: string
  ) {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? { ...u, name }
          : u
      )
    );
  }

  /* =========================
     SEARCH PLACES
  ========================= */

  async function searchPlaces() {
    if (users.length === 0) return;

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller =
      new AbortController();

    abortRef.current = controller;

    setSearchAttempted(false);
    setPlaces([]);
    setLoadingPlaces(true);

    try {
      const currentCenter =
        optimalMeetingPoint(users);

      const radius =
        suggestedRadius(users);

      const result =
        await findPlacesAround(
          currentCenter.lat,
          currentCenter.lng,
          Math.round(radius),
          placeType,
          controller.signal
        );

      setPlaces(result);
      setSearchAttempted(true);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error(
          "Search places error:",
          err
        );
      }
    } finally {
      setLoadingPlaces(false);
    }
  }

  /* =========================
     RANKING LOGIC
  ========================= */

  const rankedPlaces = useMemo(() => {
    if (places.length === 0) return [];

    return places
      .filter(isValidPlace)
      .map((p) => ({
        ...p,
        totalDistance: users.reduce(
          (sum, u) =>
            sum + distance(u, p),
          0
        ),
      }));
  }, [places, users]);

  const displayedPlaces = useMemo(() => {
    if (rankedPlaces.length === 0)
      return [];

    const sorted = [...rankedPlaces].sort(
      (a, b) =>
        a.totalDistance -
        b.totalDistance
    );

    return showAll
      ? sorted
      : sorted.slice(0, 5);
  }, [rankedPlaces, showAll]);

  /* =========================
     UI
  ========================= */

  return (
    <div className={`map-client-container ${isDark ? "dark" : ""}`}>
      {/* SIDEBAR */}
      <aside className="sidebar">
        {/* HEADER */}
        <header className="sidebar-header">
          <div className="flex items-center justify-between">
            <h1 className="text-foreground">
              <span className="text-accent text-3xl animate-bounce-subtle">🎯</span> Meetup Finder
            </h1>
            <button
              onClick={() => setIsDark(!isDark)}
              className="theme-toggle"
              title="Chuyển chế độ Sáng/Tối"
            >
              {isDark ? "☀️" : "🌙"}
            </button>
          </div>
          <p className="text-muted-foreground text-sm font-medium">
            Tìm điểm hẹn cực vui cho mọi người 💖
          </p>
        </header>

        <div className="sidebar-content">
          {/* ADDRESS INPUT SECTION */}
          <section>
            <h2 className="section-title">
              <span>📍</span> Vị trí của bạn nè
            </h2>
            <AddressInput onAddUser={addUser} />
            <div className="mt-3">
              <button
                onClick={addTestUsers}
                className="test-data-btn"
              >
                ⚡ Thêm nhanh địa chỉ mẫu
              </button>
            </div>
          </section>

          {/* USER LIST SECTION */}
          {users.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="section-title">
                <span>👥</span> Nhóm mình ({users.length})
              </h2>
              <div className="space-y-3">
                {users.map((u, i) => (
                  <div key={u.id} className="member-card group">
                    <div className="member-card-header">
                      <div className="member-index">
                        {i + 1}
                      </div>
                      <input
                        value={u.name}
                        onChange={(e) => updateUserName(u.id, e.target.value)}
                        className="member-name-input"
                      />
                      <button
                        onClick={() => removeUser(u.id)}
                        className="p-2 hover:text-red-500 transition-all text-sm font-black"
                        title="Xóa"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate pl-12 font-medium">
                      {u.address ?? "Tọa độ: " + u.lat.toFixed(4) + ", " + u.lng.toFixed(4)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SEARCH CONTROLS SECTION */}
          {users.length >= 2 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="section-title">
                <span>🔍</span> Mình đi đâu ta?
              </h2>
              <div className="flex flex-col gap-3">
                <select
                  value={placeType}
                  onChange={(e) => setPlaceType(e.target.value as any)}
                  className="w-full p-4 bg-card border-2 border-border rounded-[1.5rem] text-sm font-black text-foreground focus:ring-4 focus:ring-accent/20 outline-none appearance-none cursor-pointer hover:border-accent transition-all shadow-sm"
                >
                  <option value="cafe">☕ Quán cà phê chill chill</option>
                  <option value="restaurant">🍽 Nhà hàng ngon tuyệt</option>
                  <option value="sports">⚽ Sân chơi vận động</option>
                  <option value="cinema">🎬 Rạp phim bom tấn</option>
                </select>

                <button
                  onClick={searchPlaces}
                  disabled={loadingPlaces}
                  className="search-btn"
                >
                  {loadingPlaces ? (
                    <>
                      <span className="animate-spin text-xl">⏳</span> Đang tìm nè...
                    </>
                  ) : (
                    <>
                      <span>✨</span> Tìm điểm hẹn "Xịn" nhất
                    </>
                  )}
                </button>
              </div>
            </section>
          )}

          {/* RESULTS SECTION */}
          {rankedPlaces.length > 0 && (
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title mb-0">
                  🏁 Gợi ý cho nhóm
                </h2>
                {rankedPlaces.length > 5 && (
                  <button
                    onClick={() => setShowAll(!showAll)}
                    className="text-[11px] text-accent hover:underline font-black"
                  >
                    {showAll ? "Xem Top 5" : "Xem hết luôn"}
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {displayedPlaces.map((p, index) => (
                  <div
                    key={p.id}
                    className={`place-card ${index === 0 ? "top-pick" : ""}`}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div className="font-black text-sm text-foreground flex items-center gap-2 leading-tight">
                        {index === 0 && <span className="animate-bounce text-xl">🏆</span>}
                        {p.name}
                      </div>
                      <div className="text-[10px] px-3 py-1.5 bg-accent text-white rounded-full font-black whitespace-nowrap shadow-md">
                        {(p.totalDistance / 1000).toFixed(1)} km
                      </div>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-2 line-clamp-2 font-medium">
                      {p.address}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* NO RESULTS ERROR */}
          {searchAttempted && rankedPlaces.length === 0 && (
            <div className="p-6 bg-red-500/10 border-2 border-red-500/20 rounded-[2rem] text-red-500 text-sm font-black text-center animate-bounce-subtle">
              😕 Hix, không thấy chỗ nào phù hợp cả...
            </div>
          )}
        </div>

        {/* FOOTER */}
        <footer className="p-6 text-center border-t border-border bg-card/30">
          <p className="text-[11px] text-muted-foreground font-bold flex items-center justify-center gap-1">
            © 2026 Meetup Finder • Kết nối sự đồng điệu <span>💖</span>
          </p>
        </footer>
      </aside>

      {/* MAP AREA */}
      <main className="flex-1 relative">
        <MapView users={users} center={center} places={displayedPlaces} isDark={isDark} />

        {/* Floating Welcome Message (if no users) */}
        {users.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-[1000] pointer-events-none">
            <div className="welcome-panel animate-in zoom-in duration-700 hover-bounce">
              <div className="text-8xl mb-6 animate-float">🚀</div>
              <h2 className="text-5xl font-black text-foreground mb-4 tracking-tighter">Gặp nhau thôi!</h2>
              <p className="text-muted-foreground text-lg font-bold leading-relaxed">
                Thêm địa chỉ của bạn và nhóm bạn để tụi mình tìm điểm hẹn "Xịn" nhất quả đất nha!
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}