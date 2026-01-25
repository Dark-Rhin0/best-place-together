"use client";

import { useState } from "react";
import { geocodeAddress } from "@/lib/geocode";

type Props = {
  onAddUser: (u: { lat: number; lng: number }) => void;
};

export default function AddressInput({ onAddUser }: Props) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!address.trim()) return;

    setLoading(true);
    setError("");

    const result = await geocodeAddress(address);

    setLoading(false);

    if (!result) {
      setError("Không tìm thấy địa chỉ");
      return;
    }

    onAddUser({ lat: result.lat, lng: result.lng });
    setAddress("");
  }

  return (
    <div className="space-y-2">
      <input
        className="w-full p-2 rounded text-black"
        placeholder="Nhập địa chỉ của bạn (VD: 1 Đại Cồ Việt, Hà Nội)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 rounded"
      >
        {loading ? "Đang tìm..." : "Thêm địa chỉ"}
      </button>

      {error && <div className="text-red-400">{error}</div>}
    </div>
  );
}
