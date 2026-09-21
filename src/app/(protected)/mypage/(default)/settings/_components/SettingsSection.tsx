"use client";

import { useEffect, useState } from "react";

import { ErrorState } from "@/components/common/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/http/api-error";
import { useUpdateSettingsMutation } from "@/queries/member/mutations";
import { useSettingsQuery } from "@/queries/member/queries";

import { SettingsToggleRow } from "./SettingsToggleRow";

const SECTION_HEADER_CLASS =
  "w-full border-b border-jade-fill px-3 py-2 text-body-s-b text-font-dark";

/**
 * 설정 화면(`/mypage/settings`, Figma MY-7) 콘텐츠. 실제로 백엔드에 저장되는 건
 * 다크모드·마케팅 수신동의 2개뿐이다(BE `MemberActivityService.Settings` 직접 대조 확인) —
 * "주문 및 배송 알림받기"·"찜 목록 가격 변동/재입고 알림받기"는 대응 필드가 없어 로컬
 * 상태로만 둔다(새로고침 시 초기값으로 리셋). 알림 기능 MVP 범위가 확정되면 재검토한다.
 */
function SettingsSection() {
  const settingsQuery = useSettingsQuery();
  const updateSettings = useUpdateSettingsMutation();
  const [orderNotification, setOrderNotification] = useState(true);
  const [wishlistNotification, setWishlistNotification] = useState(true);

  // 다크 색상 토큰은 아직 없어 지금은 시각적으로 안 바뀌지만, 이후 다크 테마 작업이
  // 들어오면 바로 동작하도록 `<html>`의 `dark` 클래스는 지금부터 실제로 동기화한다.
  // cleanup에서 되돌리지 않는다 — 다른 페이지로 이동해도 선호를 유지하려는 의도.
  useEffect(() => {
    if (settingsQuery.data) {
      document.documentElement.classList.toggle(
        "dark",
        settingsQuery.data.darkMode,
      );
    }
  }, [settingsQuery.data]);

  if (settingsQuery.isPending) {
    return (
      <div className="space-y-3 pb-6">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (settingsQuery.isError) {
    const error = settingsQuery.error;
    return (
      <ErrorState
        code={error instanceof ApiError ? error.code : undefined}
        status={error instanceof ApiError ? error.status : undefined}
        onRetry={() => void settingsQuery.refetch()}
      />
    );
  }

  const settings = settingsQuery.data;

  return (
    <div className="flex w-full flex-col gap-6 pb-6">
      <div className="flex w-full flex-col items-start justify-center gap-2 px-3">
        <h2 className="text-title-m text-font-dark">설정</h2>
      </div>

      <div className="flex w-full flex-col gap-2">
        <div className={SECTION_HEADER_CLASS}>화면 설정</div>
        <SettingsToggleRow
          label="다크모드 변경"
          checked={settings.darkMode}
          onCheckedChange={(checked) =>
            updateSettings.mutate({ darkMode: checked })
          }
        />
      </div>

      <div className="flex w-full flex-col gap-2">
        <div className={SECTION_HEADER_CLASS}>알림 설정</div>
        <SettingsToggleRow
          label="주문 및 배송 알림받기"
          checked={orderNotification}
          onCheckedChange={setOrderNotification}
        />
        <SettingsToggleRow
          label="찜 목록 가격 변동 / 재입고 알림받기"
          checked={wishlistNotification}
          onCheckedChange={setWishlistNotification}
        />
        <SettingsToggleRow
          label="마케팅 수신동의 ( SMS / E-mail )"
          checked={settings.marketing}
          onCheckedChange={(checked) =>
            updateSettings.mutate({ marketing: checked })
          }
        />
      </div>
    </div>
  );
}

export { SettingsSection };
