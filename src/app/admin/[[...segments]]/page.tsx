import { notFound } from "next/navigation";
import ReviewsAdmin from "@/component/admin/ReviewsAdmin";
import GalleryAdmin from "@/component/admin/GalleryAdmin";
import Overview from "@/component/admin/Overview";
import EntityPage from "@/component/admin/EntityPage";
import EntityDetail from "@/component/admin/EntityDetail";
import OrderDetail from "@/component/admin/OrderDetail";
import ManualOrder from "@/component/admin/ManualOrder";
import PurchaseForm from "@/component/admin/PurchaseForm";
import Settings from "@/component/admin/Settings";
import { entities } from "@/lib/admin/entities";
export default async function AdminPage({
  params,
}: {
  params: Promise<{ segments?: string[] }>;
}) {
  const { segments = [] } = await params;
  const [entity, id] = segments;
  if (segments.length > 2) notFound();
  if (!entity) return <Overview />;
  if (entity === "login" && !id) return null;
  if (entity === "settings" && !id) return <Settings />;
  if (entity === "gallery") return <GalleryAdmin key={id || "list"} id={id} />;
  if (entity === "reviews" && !id) return <ReviewsAdmin />;
  if (!entities[entity]) notFound();
  if (entity === "orders" && id === "new") return <ManualOrder />;
  if (entity === "purchases" && id === "new") return <PurchaseForm />;
  if (entity === "orders" && id) return <OrderDetail key={id} id={id} />;
  if (id)
    return <EntityDetail key={`${entity}/${id}`} entity={entity} id={id} />;
  return <EntityPage key={entity} entity={entity} />;
}
