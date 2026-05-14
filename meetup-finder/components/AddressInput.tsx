"use client";

import { useState, useEffect } from "react";
import {
  geocodeAddress,
  autocompleteAddress,
  Suggestion,
} from "@/lib/geocode";
import "./AddressInput.css";

type Props = {
  onAddUser: (u: { lat: number; lng: number; address: string }) => void;
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
      setError("Hix, hông tìm thấy chỗ này...");
      return;
    }

    onAddUser({ lat: result.lat, lng: result.lng, address: result.displayName });
    setAddress("");
    setSuggestions([]);
  }

  function handleSelect(s: Suggestion) {
    onAddUser({ lat: s.lat, lng: s.lng, address: s.displayName }); // add marker
    setAddress("");       // ✅ clear input
    setSuggestions([]);   // ✅ clear dropdown
  }

  return (
    <div className="address-input-container">
      <div className="input-wrapper">
        <input
          className="address-field"
          placeholder="Bạn đang ở đâu nè?..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div className="input-icon">📍</div>
      </div>

      {/* Dropdown gợi ý */}
      {suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map((s, i) => (
            <div
              key={i}
              onClick={() => handleSelect(s)}
              className="suggestion-item"
            >
              {s.displayName}
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="add-btn"
      >
        {loading ? "Đang tìm xíu..." : "Thêm vị trí"}
      </button>

      {error && (
        <div className="text-red-500 text-sm font-bold animate-bounce mt-1">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
