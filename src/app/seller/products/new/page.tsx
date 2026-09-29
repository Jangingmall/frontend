import { SellerStudio } from "./_components/SellerStudio";
import { ServerSellerStudio } from "./_components/ServerSellerStudio";
export const metadata = { title: "AI 상세페이지 제작 | 판매 관리" };
export default async function SellerStudioPage({
  searchParams,
}: {
  searchParams: Promise<{
    project?: string;
    example?: string;
    demo?: string;
    productId?: string;
    generationId?: string;
  }>;
}) {
  const params = await searchParams;
  if (params.demo === "1" || params.example === "1" || params.project)
    return (
      <SellerStudio
        key={params.project ?? "new"}
        projectId={params.project}
        isExample={params.example === "1"}
      />
    );
  const parseId = (value?: string) =>
    value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
      ? Number(value)
      : undefined;
  const productId = parseId(params.productId),
    generationId = parseId(params.generationId);
  if (
    (params.productId && !productId) ||
    (params.generationId && (!generationId || !productId))
  )
    return <p role="alert">올바르지 않은 작업 주소입니다.</p>;
  return (
    <ServerSellerStudio
      key={productId ?? "new"}
      initialProductId={productId}
      initialGenerationId={generationId}
    />
  );
}
