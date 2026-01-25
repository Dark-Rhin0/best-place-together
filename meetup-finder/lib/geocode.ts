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
