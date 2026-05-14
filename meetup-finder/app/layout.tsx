import "./globals.css";
import "leaflet/dist/leaflet.css";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata = {
  title: "Meetup Finder - Tìm điểm hẹn tối ưu",
  description: "Ứng dụng giúp bạn tìm điểm gặp mặt công bằng nhất cho mọi người.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        {children}
      </body>
    </html>
  );
}
