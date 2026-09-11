import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";

/**
 * 매칭 라우트가 없거나(`notFound()` 미호출, URL 자체가 없음) 세그먼트에서 `notFound()`를
 * 호출했을 때의 전역 기본 404 안내. (docs/ui-system.md §7.4)
 *
 * 홈 이동 CTA는 `components/ui/button`(`Button`/`buttonVariants`)을 재사용하지 않는다.
 * `Button`은 `"use client"`라 이 Server Component에서 직접 못 쓰고(`buttonVariants`도
 * 같은 모듈이라 서버에서 호출 불가), `<Button render={<Link/>}>`로 합성하면 Base UI가
 * `role="button"`을 강제해 네이티브 링크 시맨틱이 깨진다(둘 다 로컬에서 실측 확인).
 * `outline`+`s` variant의 시각 형태만 손으로 옮겼다 — `Header`의 `HeaderIconButton`과
 * 같은 선례(공용 `Button` 대신 목적에 맞는 최소 마크업).
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <EmptyState
        title="페이지를 찾을 수 없어요"
        description="주소가 잘못됐거나 삭제된 페이지예요."
        action={
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xs border border-(--button-border-black) px-6 text-body-m text-font-dark transition-colors hover:bg-states-hover"
          >
            홈으로
          </Link>
        }
      />
    </main>
  );
}
