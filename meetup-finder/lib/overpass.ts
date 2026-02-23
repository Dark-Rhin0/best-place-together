export async function findPlacesAround(
  lat: number,
  lng: number,
  radius: number,
  type: "cafe" | "restaurant" | "sports" | "cinema"
) {
  const preciseTags: Record<string, string> = {
    cafe: '["amenity"="cafe"]',
    restaurant: '["amenity"="restaurant"]',
    sports: '["leisure"="pitch"]',
    cinema: '["amenity"="cinema"]',
  };

  const fallbackRegex: Record<string, string> = {
    cafe: 'cafe|coffee',
    restaurant: 'restaurant|quan an|nha hang',
    sports: 'sport|gym|fitness|san',
    cinema: 'cinema|movie|theatre|rap',
  };

  async function runQuery(inner: string) {
    const query =
      `[out:json][timeout:20];(` +
      inner +
      `);out center tags;`;

    const res = await fetch(
      "https://overpass-api.de/api/interpreter",
      {
        method: "POST",
        body: query,
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(text); // 🔥 in ra lỗi thật từ Overpass
      throw new Error(`Overpass API error: ${res.status}`);
    }

    return res.json();
  }

  function preciseQuery() {
    const tag = preciseTags[type];
    return `
      node${tag}(around:${radius},${lat},${lng});
      way${tag}(around:${radius},${lat},${lng});
    `;
  }

  function fallbackQuery() {
    const regex = fallbackRegex[type];
    return `
      node["name"~"${regex}",i](around:${radius},${lat},${lng});
      way["name"~"${regex}",i](around:${radius},${lat},${lng});
    `;
  }

  const unique = new Map<number, any>();

  try {
    // 1️⃣ precise
    const preciseData = await runQuery(preciseQuery());
    collect(preciseData, unique);

    // 2️⃣ fallback nếu ít
    if (unique.size < 5) {
      const fallbackData = await runQuery(fallbackQuery());
      collect(fallbackData, unique);
    }

    return Array.from(unique.values());
  } catch (err) {
    console.error(err);
    return [];
  }
}

function collect(data: any, map: Map<number, any>) {
  for (const el of data.elements || []) {
    const t = el.tags || {};
    const latValue = el.lat ?? el.center?.lat;
    const lngValue = el.lon ?? el.center?.lon;

    if (typeof latValue !== "number" || typeof lngValue !== "number")
      continue;

    map.set(el.id, {
      id: el.id,
      name: t.name?.trim() || "Không tên",
      lat: latValue,
      lng: lngValue,
      address: formatAddress(t),
    });
  }
}

function formatAddress(t: any) {
  const parts = [
    t["addr:housenumber"],
    t["addr:street"],
    t["addr:suburb"] || t["addr:ward"],
    t["addr:district"],
    t["addr:city"],
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "";
}