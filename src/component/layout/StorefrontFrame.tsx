"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import OrderHelp from "./OrderHelp";
export default function StorefrontFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname?.startsWith("/admin/"))
    return <>{children}</>;
  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
      <OrderHelp />
      <Footer />
    </>
  );
}
