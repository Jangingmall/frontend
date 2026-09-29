"use client";
import "./seller-studio.css";

import Link from "next/link";

import { useDemoSession } from "@/lib/demo-session";
import { publicEnv } from "@/lib/env";
import { useAuthStore } from "@/stores/auth";

export function SellerAccess({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuthStore();
  const demo = useDemoSession();
  if (status === "loading")
    return (
      <div className="ss-shell">
        <p role="status">로그인 상태를 확인하고 있습니다.</p>
      </div>
    );
  if (status !== "authenticated")
    return (
      <div className="ss-shell">
        <div className="ss-form-wrap">
          <h1>판매자 로그인</h1>
          <p>
            판매자 계정으로 로그인한 뒤 판매자 스튜디오에 다시 접속해 주세요.
          </p>
          <Link href="/login">로그인하기</Link>
        </div>
      </div>
    );
  if (user?.role !== "ARTISAN" || (!publicEnv.apiMocking && demo))
    return (
      <div className="ss-shell">
        <div className="ss-form-wrap">
          <h1>판매자 계정이 필요합니다</h1>
          <p>
            승인된 판매자 계정으로 이용해 주세요. 시연 계정으로 실제 상품을
            저장할 수 없습니다.
          </p>
        </div>
      </div>
    );
  return children;
}
