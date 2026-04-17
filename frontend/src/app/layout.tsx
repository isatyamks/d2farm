import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "D2Farm | Smart Kitchen Supply",
  description: "B2B procurement platform for restaurants and kitchens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
         <script src="https://unpkg.com/@phosphor-icons/web" async></script>
         <script src="https://cdn.jsdelivr.net/npm/chart.js" async></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
