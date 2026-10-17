import { Suspense } from "react";
import type { Metadata } from "next";
import AdminShell from "@/component/admin/AdminShell";
import "./admin.css";
export const metadata: Metadata = {
  title: "Studio admin | PolaroidsBySolly",
  robots: { index: false, follow: false },
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="admin-root">
          <p className="adm-loading">Opening your studio…</p>
        </div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
