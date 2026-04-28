import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";

import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans"
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif"
});

export const metadata: Metadata = {
  title: "Republic Digital Maturity Index",
  description: "Internal report builder for Republic Digital Consultancy."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${playfair.variable} bg-stone-100 text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
