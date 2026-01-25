import MapClient from "@/components/MapClient";

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Tìm địa điểm gặp mặt tối ưu
      </h1>
      <MapClient />
    </main>
  );
}
