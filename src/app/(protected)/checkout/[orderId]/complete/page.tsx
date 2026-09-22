import { notFound } from "next/navigation";

import { publicEnv } from "@/lib/env";

import { resolveOrderCompleteOutcome } from "./_components/order-complete-state";
import { OrderCompleteRoute } from "./_components/OrderCompleteRoute";
import { RealOrderComplete } from "./_components/RealOrderComplete";

interface OrderCompleteRoutePageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ result?: string | string[] }>;
}

export default async function OrderCompleteRoutePage({
  params,
  searchParams,
}: OrderCompleteRoutePageProps) {
  const [{ orderId }, { result }] = await Promise.all([params, searchParams]);
  if (/^[1-9]\d*$/.test(orderId) && Number.isSafeInteger(Number(orderId)))
    return <RealOrderComplete orderId={Number(orderId)} />;
  const outcome = resolveOrderCompleteOutcome(
    orderId,
    result,
    publicEnv.apiMocking && !publicEnv.isVercelProduction,
  );

  if (!outcome) notFound();
  return <OrderCompleteRoute outcome={outcome} />;
}
