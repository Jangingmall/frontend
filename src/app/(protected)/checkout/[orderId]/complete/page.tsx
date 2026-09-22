import { notFound } from "next/navigation";

import { publicEnv } from "@/lib/env";

import { resolveOrderCompleteOutcome } from "./_components/order-complete-state";
import { OrderCompleteRoute } from "./_components/OrderCompleteRoute";

interface OrderCompleteRoutePageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ result?: string | string[] }>;
}

export default async function OrderCompleteRoutePage({
  params,
  searchParams,
}: OrderCompleteRoutePageProps) {
  const [{ orderId }, { result }] = await Promise.all([params, searchParams]);
  const outcome = resolveOrderCompleteOutcome(
    orderId,
    result,
    publicEnv.apiMocking &&
      (!publicEnv.isVercelProduction || publicEnv.allowProductionMock),
  );

  if (!outcome) notFound();
  return <OrderCompleteRoute outcome={outcome} />;
}
