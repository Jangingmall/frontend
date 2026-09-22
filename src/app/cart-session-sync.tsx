"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { publicEnv } from "@/lib/env";
import { useMergeGuestCartMutation } from "@/queries/cart/mutations";
import { useAuthStore } from "@/stores/auth";

interface CartSessionSyncProps {
  children: ReactNode;
}

/** 로그인·세션 복원 후 게스트 상품을 병합한 다음 구매 화면을 연다. */
export function CartSessionSync({ children }: CartSessionSyncProps) {
  const userId = useAuthStore((state) =>
    state.status === "authenticated" && state.user?.role === "USER"
      ? state.user.id
      : null,
  );
  if (publicEnv.apiMocking || userId === null) return children;
  return (
    <AuthenticatedCartSync key={userId} userId={userId}>
      {children}
    </AuthenticatedCartSync>
  );
}

function AuthenticatedCartSync({
  children,
  userId,
}: CartSessionSyncProps & { userId: number }) {
  const { mutateAsync } = useMergeGuestCartMutation();
  const attempt = useRef<{ userId: number; promise: Promise<unknown> } | null>(
    null,
  );
  const [result, setResult] = useState<{
    userId: number;
    failed: boolean;
  } | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (attempt.current?.userId !== userId) {
      attempt.current = { userId, promise: mutateAsync() };
    }
    void attempt.current.promise.then(
      () => {
        if (!cancelled) setResult({ userId, failed: false });
      },
      () => {
        if (!cancelled) setResult({ userId, failed: true });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId, mutateAsync, retry]);

  if (result?.userId !== userId) {
    return (
      <output className="p-8 text-center">장바구니를 연결하는 중입니다…</output>
    );
  }
  return (
    <>
      {result.failed && (
        <div
          role="alert"
          className="bg-bg-light flex items-center justify-center gap-4 px-4 py-3 text-sm"
        >
          로그인 전 장바구니를 가져오지 못했습니다.
          <Button
            variant="outline"
            onClick={() => {
              attempt.current = null;
              setResult(null);
              setRetry((value) => value + 1);
            }}
          >
            다시 시도
          </Button>
        </div>
      )}
      {children}
    </>
  );
}
