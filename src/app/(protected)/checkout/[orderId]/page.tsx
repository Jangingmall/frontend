import { CheckoutEntry } from "@/app/(protected)/checkout/_components/CheckoutEntry";
export default async function Page({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  return <CheckoutEntry orderId={orderId} />;
}
