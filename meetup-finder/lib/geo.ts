export function geometricCenter(
  users: { lat: number; lng: number }[]
) {
  const lat =
    users.reduce((sum, u) => sum + u.lat, 0) / users.length;

  const lng =
    users.reduce((sum, u) => sum + u.lng, 0) / users.length;

  return { lat, lng };
}

type Point = { lat: number; lng: number };

export function optimalMeetingPoint(
  users: Point[],
  iterations = 50
): Point {
  // nếu chỉ 1 người
  if (users.length === 1) return users[0];

  // khởi tạo = trung bình
  let x =
    users.reduce((s, u) => s + u.lat, 0) / users.length;
  let y =
    users.reduce((s, u) => s + u.lng, 0) / users.length;

  for (let k = 0; k < iterations; k++) {
    let numX = 0;
    let numY = 0;
    let den = 0;

    for (const u of users) {
      const d = Math.sqrt(
        (x - u.lat) ** 2 + (y - u.lng) ** 2
      ) || 0.0001; // tránh chia 0

      numX += u.lat / d;
      numY += u.lng / d;
      den += 1 / d;
    }

    x = numX / den;
    y = numY / den;
  }

  return { lat: x, lng: y };
}
