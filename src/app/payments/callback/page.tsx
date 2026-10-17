import { redirect } from "next/navigation";
export default async function PaymentCallback({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference || params.trxref;
  redirect(
    reference
      ? `/checkout?paymentReference=${encodeURIComponent(reference)}`
      : "/checkout",
  );
}
