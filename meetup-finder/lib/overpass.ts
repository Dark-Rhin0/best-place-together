export async function findPlacesAround(
  lat: number,
  lng: number,
  radius: number,
  type: "cafe" | "restaurant" | "sports"
) {
  const tagMap: Record<string, string> = {
    cafe: '["amenity"="cafe"]',
    restaurant: '["amenity"="restaurant"]',
    sports: '["leisure"="pitch"]',
  };

  const query = `
    [out:json];
    (
      node${tagMap[type]}(around:${radius},${lat},${lng});
      way${tagMap[type]}(around:${radius},${lat},${lng});
    );
    out center tags;
  `;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  });

  const data = await res.json();

  return data.elements
    .map((el: any) => {
      const t = el.tags || {};
      return {
        id: el.id,
        name: t.name || "Không tên",
        lat: el.lat || el.center?.lat,
        lng: el.lon || el.center?.lon,
        address: formatAddress(t),
      };
    })
    .filter((p: any) => p.lat && p.lng);
}

function formatAddress(t: any) {
  return [
    t["addr:housenumber"],
    t["addr:street"],
    t["addr:ward"] || t["addr:suburb"],
    t["addr:district"],
    t["addr:city"],
  ]
    .filter(Boolean)
    .join(", ");
}
