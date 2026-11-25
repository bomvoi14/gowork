import type { Metadata } from "next";
import { Geist, Prompt } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const geist = Geist({ subsets: ["latin"], weight: "400", display: "swap", variable: "--font-gtd-credit" });

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
      <body className={`${prompt.className} ${geist.variable}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
