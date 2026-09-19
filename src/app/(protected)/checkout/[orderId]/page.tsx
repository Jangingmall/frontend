import { CheckoutEntry } from "@/app/(protected)/checkout/_components/CheckoutEntry";
interface CheckoutRouteProps {
  params: Promise<{ orderId: string }>;
}
export default async function Page({ params }: CheckoutRouteProps) {
  const { orderId } = await params;
  return <CheckoutEntry orderId={orderId} />;
}
