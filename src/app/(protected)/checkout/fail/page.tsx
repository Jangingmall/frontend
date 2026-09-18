import { CheckoutEntry } from "@/app/(protected)/checkout/_components/CheckoutEntry";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; reason?: string }>;
}) {
  const { orderId, reason } = await searchParams;
  const outcome =
    reason === "timeout" || reason === "cancelled" ? reason : "declined";
  return <CheckoutEntry orderId={orderId ?? ""} initialFeedback={outcome} />;
}
