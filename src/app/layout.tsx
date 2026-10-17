import type { Metadata } from "next";
import { Caveat, Fraunces, Inter, Anton } from "next/font/google";
import { CartProvider } from "@/context/CartContext";

import "./globals.css";

import StorefrontFrame from "@/component/layout/StorefrontFrame";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
});
const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

export const metadata: Metadata = {
  title: "PolaroidsBySolly",
  description:
    "Personalised photo prints and Polaroid stations for weddings, birthdays and events. Turn your favourite memories into keepsakes with PolaroidsBySolly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${caveat.variable} ${anton.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <CartProvider>
          <StorefrontFrame>{children}</StorefrontFrame>
        </CartProvider>
      </body>
    </html>
  );
}
