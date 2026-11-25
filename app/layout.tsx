import type { Metadata } from "next";
import { Inter, Noto_Sans_Thai, Prompt } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-brand-inter" });
const notoThai = Noto_Sans_Thai({ subsets: ["thai", "latin"], display: "swap", variable: "--font-brand-thai" });

export const metadata: Metadata = {
  title: "GTD-GoWork App",
  description: "สรุปวันปฏิบัติงาน",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${prompt.className} ${inter.variable} ${notoThai.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}