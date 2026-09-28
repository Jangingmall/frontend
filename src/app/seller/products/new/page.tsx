import { SellerStudio } from "./_components/SellerStudio";
export const metadata = { title: "AI 상세페이지 제작 | 판매 관리" };
export default async function SellerStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; example?: string }>;
}) {
  const { project, example } = await searchParams;
  return (
    <SellerStudio
      key={project ?? "new"}
      projectId={project}
      isExample={example === "1"}
    />
  );
}
