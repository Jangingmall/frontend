"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

import { ErrorState } from "@/components/common/error-state";

export default function ProductDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  return (
    <ErrorState
      className="my-12"
      title="상품 정보를 불러오지 못했습니다"
      description="잠시 후 다시 시도해주세요."
      onRetry={() =>
        startTransition(() => {
          router.refresh();
          reset();
        })
      }
    />
  );
}
