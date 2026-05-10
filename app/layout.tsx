import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Gravia — AIでインスタ運用を、もっと楽に、もっと伸ばす。",
  icons: {
    icon: "/images/gravia_mark.png",
  },
  description: "GraviaはAIを活用したInstagram運用プラットフォームです。キャプション自動生成・スケジュール管理・アナリティクスを一括で。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistMono.variable} ${inter.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
