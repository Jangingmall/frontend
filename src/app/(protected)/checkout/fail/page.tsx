import { CheckoutEntry } from "@/app/(protected)/checkout/_components/CheckoutEntry";
interface CheckoutFailRouteProps {
  searchParams: Promise<{ orderId?: string; reason?: string }>;
}
export default async function Page({ searchParams }: CheckoutFailRouteProps) {
  const { orderId, reason } = await searchParams;
  const outcome =
    reason === "timeout" || reason === "cancelled" ? reason : "declined";
  return <CheckoutEntry orderId={orderId ?? ""} initialFeedback={outcome} />;
}
