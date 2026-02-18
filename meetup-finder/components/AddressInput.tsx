"use client";

import { useState, useEffect } from "react";
import {
  geocodeAddress,
  autocompleteAddress,
  Suggestion,
} from "@/lib/geocode";

type Props = {
  onAddUser: (u: { lat: number; lng: number }) => void;
};

export default function AddressInput({ onAddUser }: Props) {
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  // 🔹 Debounce autocomplete
  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (address.length < 3) {
        setSuggestions([]);
        return;
      }

      const results = await autocompleteAddress(address);
      setSuggestions(results);
    }, 400);

    return () => clearTimeout(timeout);
  }, [address]);

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
    setSuggestions([]);
  }

  function handleSelect(s: Suggestion) {
    setAddress(s.displayName);
    setSuggestions([]);
    onAddUser({ lat: s.lat, lng: s.lng });
  }

  return (
    <div className="space-y-2 relative">
      <input
        className="w-full p-2 rounded text-black"
        placeholder="Nhập địa chỉ của bạn (VD: 1 Đại Cồ Việt, Hà Nội)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
      />

      {/* Dropdown gợi ý */}
      {suggestions.length > 0 && (
        <div className="absolute z-50 w-full bg-white text-black rounded shadow max-h-60 overflow-y-auto">
          {suggestions.map((s, i) => (
            <div
              key={i}
              onClick={() => handleSelect(s)}
              className="p-2 hover:bg-gray-200 cursor-pointer"
            >
              {s.displayName}
            </div>
          ))}
        </div>
      )}

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
