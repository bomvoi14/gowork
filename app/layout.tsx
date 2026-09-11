import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

// นำเข้าฟอนต์ Kanit จาก Google Fonts
const kanit = Kanit({ 
  subsets: ["latin", "thai"],
  weight: ['300', '400', '500', '700'] 
});

export const metadata: Metadata = {
  title: "Site Schedule App",
  description: "แอปพลิเคชันดูตารางออกไซต์งาน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      {/* ใส่ className ของฟอนต์ที่ body เพื่อให้ใช้ทั้งแอป */}
      <body className={`${kanit.className} bg-gray-100 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}