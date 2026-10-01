import { notFound } from "next/navigation";

import { isSellerDemoId } from "@/api/seller-demo/scenarios";
import { SellerDemoStudio } from "@/app/seller/products/new/_components/SellerDemoStudio";
export const metadata = {
  title: "AI 상세페이지 시연 | 미담",
  robots: { index: false, follow: false },
};
export default async function SellerDemoPage({
  params,
}: {
  params: Promise<{ scenario: string }>;
}) {
  const { scenario } = await params;
  if (!isSellerDemoId(scenario)) notFound();
  return <SellerDemoStudio key={scenario} scenario={scenario} />;
}
