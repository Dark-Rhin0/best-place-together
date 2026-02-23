export async function geocodeAddress(address: string) {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
    });

  const res = await fetch(url, {
    headers: {
      "User-Agent": "meetup-finder/1.0",
    },
  });

  if (!res.ok) return null;

  const data = await res.json();

  if (!data || data.length === 0) return null;

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name,
  };
}

// hàm gợi ý nhập vị trí
export type Suggestion = {
  lat: number;
  lng: number;
  displayName: string;
};

export async function autocompleteAddress(
  query: string
): Promise<Suggestion[]> {
  if (!query || query.length < 3) return [];

  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: query,
      format: "json",
      addressdetails: "1",
      limit: "5",
    });

  const res = await fetch(url, {
    headers: {
      "User-Agent": "meetup-finder/1.0",
    },
  });

  if (!res.ok) return [];

  const data = await res.json();

  if (!data || data.length === 0) return [];

  return data.map((item: any) => ({
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    displayName: item.display_name,
  }));
}
