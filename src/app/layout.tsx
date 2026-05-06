import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oshxona — Mazali halol taomlar",
  description:
    "Koreyadagi o'zbek restoranlarini toping. Find Halal Uzbek food near you in Korea.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Oshxona",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
