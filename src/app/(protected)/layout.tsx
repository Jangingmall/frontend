"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";

import { useAuthStore } from "@/stores/auth";

/**
 * 보호 라우트 가드. (docs/routing-and-auth.md §5.1)
 *
 * access token이 메모리에만 있어 서버·엣지에서 못 읽으므로 접근 제어는 클라이언트에서 한다.
 * 보호가 필요한 페이지는 이 route group 안에 둔다(URL엔 `(protected)`가 안 드러난다).
 * `status`가 확정되기 전(`loading`)엔 로딩을 보여줘, 내부 페이지가 어중간한 상태를 안 본다.
 */
export default function ProtectedLayout({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") {
      // `/login`은 이후 작업에서 추가된다. typedRoutes가 아직 모르므로 캐스팅한다.
      router.replace(
        `/login?returnUrl=${encodeURIComponent(pathname)}` as Route,
      );
    }
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    // TODO: 공용 FullPageLoading/Skeleton 컴포넌트가 준비되면 교체. 지금은 최소 접근성 fallback.
    return (
      <output
        aria-live="polite"
        className="flex min-h-[50vh] items-center justify-center text-sm text-neutral-500"
      >
        불러오는 중…
      </output>
    );
  }

  return <>{children}</>;
}
