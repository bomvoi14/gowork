import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";

const kanit = Kanit({ 
  subsets: ["latin", "thai"],
  weight: ['300', '400', '500', '700'] 
});

export const metadata: Metadata = {
  title: "จำนวนวันตามคำสั่ง",
  description: "แอปพลิเคชันดูตารางออกไซต์งาน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${kanit.className} bg-gray-100 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
