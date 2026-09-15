"use client";

import { useSyncExternalStore } from "react";

import { mapMemberProfile } from "@/api/member/mapper";
import {
  mockIdentityFixtures,
  SEED_ACCESS_TOKEN,
} from "@/api/member/mock/fixtures";
import {
  getMockIdentity,
  setMockIdentity,
} from "@/api/member/mock/mock-identity";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

type MockIdentity = "anonymous" | "USER" | "ARTISAN" | "ADMIN";

const IDENTITIES: readonly MockIdentity[] = [
  "anonymous",
  "USER",
  "ARTISAN",
  "ADMIN",
];

const LABELS: Record<MockIdentity, string> = {
  anonymous: "없음",
  USER: "고객",
  ARTISAN: "장인",
  ADMIN: "관리자",
};

/**
 * `getMockIdentity()`를 `useSyncExternalStore`로 읽기 위한 최소 pub-sub. `localStorage`는
 * 같은 탭 안의 쓰기에 대해선 `storage` 이벤트를 안 쏜다(다른 탭에만 간다) — 그래서 이
 * 패널이 자기 버튼 클릭으로 값을 바꿀 때마다 `notify()`로 직접 구독자에게 알려준다.
 * `LoginForm.tsx`의 `rememberedEmail`과 같은 이유로 `useSyncExternalStore`를 쓴다: 서버
 * (Node)엔 `localStorage`가 없어 `useEffect` 안에서 `setState`로 동기화하면
 * `react-hooks/set-state-in-effect`(cascading render)에 걸린다 — 이쪽이 React가 권장하는
 * 정석 경로다.
 */
let listeners: Array<() => void> = [];
function notify() {
  for (const listener of listeners) listener();
}
function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}
function getServerSnapshot(): MockIdentity {
  return "anonymous";
}

/**
 * Mock 모드 전용 로그인 상태 "리모컨". (`temp/tasks/T-17-login/design.md` §5.6)
 *
 * `api/member/mock/handlers.ts`의 `/token/refresh`·`/me`가 읽는
 * `api/member/mock/mock-identity.ts`의 값을 버튼 하나로 즉시 바꾼다 — 실제 로그인 폼을
 * 거치거나 devtools에서 `localStorage`를 손으로 건드리지 않고도 없음/고객/장인/관리자
 * 4가지 화면을 오갈 수 있다. `useAuthStore`도 같이 갱신해 **새로고침 없이** 즉시 반영되고,
 * 선택은 `localStorage`에 남아 새로고침 후에도 유지된다(그다음엔 `AuthBootstrap`의 정상
 * 부팅 refresh가 같은 값을 읽어 재확인한다 — 두 경로가 다른 값을 낼 일이 없다).
 *
 * `publicEnv.apiMocking`이 꺼져 있으면(`NEXT_PUBLIC_API_MOCKING`이 아닌 실제 API 연결)
 * 렌더하지 않는다. import 자체는 정적으로 둔다 — `mock/fixtures.ts`·`mock/mock-identity.ts`는
 * (`mocks/start-browser.ts`가 동적 import하는 `setupWorker`와 달리) 순수 데이터·함수라
 * 잘못된 환경에서 throw할 일이 없고, 무게도 무시할 수준(zod는 어차피 모든 도메인
 * `validation.ts`가 이미 번들에 포함시킨다)이라 동적 import의 청크 로딩 비용을 감수할
 * 이유가 없다.
 */
export function MockIdentitySwitcher() {
  if (!publicEnv.apiMocking) return null;
  return <MockIdentitySwitcherPanel />;
}

function MockIdentitySwitcherPanel() {
  const current = useSyncExternalStore(
    subscribe,
    getMockIdentity,
    getServerSnapshot,
  );

  function selectIdentity(identity: MockIdentity) {
    setMockIdentity(identity);
    notify();
    if (identity === "anonymous") {
      useAuthStore.getState().clear();
      return;
    }
    useAuthStore
      .getState()
      .setSession(
        SEED_ACCESS_TOKEN,
        mapMemberProfile(mockIdentityFixtures[identity]),
      );
  }

  return (
    <div className="fixed right-4 bottom-4 z-100 flex items-center gap-1 rounded-md bg-neutral-900/90 p-2 text-xs text-white shadow-lg">
      <span className="px-1 font-semibold">Mock</span>
      {IDENTITIES.map((identity) => (
        <button
          key={identity}
          type="button"
          aria-pressed={current === identity}
          onClick={() => selectIdentity(identity)}
          className={cn(
            "rounded px-2 py-1",
            current === identity
              ? "bg-white text-neutral-900"
              : "hover:bg-white/20",
          )}
        >
          {LABELS[identity]}
        </button>
      ))}
    </div>
  );
}
