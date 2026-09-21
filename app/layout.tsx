import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; // 👈 1. เพิ่มบรรทัดนี้

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ระบบรายงาน",
  description: "สรุปวันปฏิบัติงาน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers> 
          {children} 
        </Providers>
      </body>
    </html>
  );
}