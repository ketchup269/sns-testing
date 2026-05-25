import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Inter } from "next/font/google";
import "../globals.css";
import Providers from "../providers";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

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

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistMono.variable} ${inter.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
