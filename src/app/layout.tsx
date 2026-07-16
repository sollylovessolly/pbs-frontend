import type { Metadata } from "next";
import { Caveat, Fraunces, Inter, Anton} from "next/font/google";
import { CartProvider } from "@/context/CartContext";



import "./globals.css";

import Header from "@/component/layout/Header";
import Footer from "@/component/layout/Footer";
import { OrderProvider } from "@/context/OrderContext";

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
  description: "Turn your favourite memories into keepsakes.",
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
        <OrderProvider>
        <CartProvider>
        <Header />

        <main className="flex-1">{children}</main>

        <Footer />
        </CartProvider>
        </OrderProvider>
      </body>
    </html>
  );
}