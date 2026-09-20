import Link from "next/link";

import { ChevronLeftIcon } from "@/components/ui/icons";

/** 상단 "< 주문 상세보기" — 목록(`/mypage/orders`)으로 돌아가는 링크(Figma 실측). */
export function OrderDetailBackLink() {
  return (
    <Link
      href="/mypage/orders"
      className="flex w-fit items-center gap-2 text-title-xl text-font-dark"
    >
      <ChevronLeftIcon aria-hidden className="size-8" />
      주문 상세보기
    </Link>
  );
}
