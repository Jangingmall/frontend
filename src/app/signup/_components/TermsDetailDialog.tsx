"use client";

import { Dialog } from "@base-ui/react/dialog";

import { Button } from "@/components/ui/button";

/**
 * 약관 전문 모달 shell(SU-2 "자세히 보기"). 실제 원문은 없다(법무 검수 대기, design.md §7-6).
 *
 * 모달 크롬은 처음엔 참조할 Figma 목업이 없다고 판단해(스펙 메모 `1515:27840`뿐인 줄 알았음)
 * 장바구니 확인 모달을 대신 참조했었는데, 사용자가 준 링크
 * (`node-id=1896-32889`, `[SU-2-social] 회원가입` 프레임 안)에 실제 렌더된 "개인정보 처리
 * 방침" 모달이 있었다 — 이 컴포넌트는 그 노드를 그대로 옮긴 것이다: 660px 카드(장바구니
 * 모달의 480px가 아니라), 본문은 배경색 없이 흰 배경 + 10% 불투명도 테두리, 하단 버튼은
 * 50:50이 아니라 "닫기"(고정 160px, outline) + "{제목}에 동의하기"(나머지 flex-1, solid).
 * 헤더 오른쪽에 있던 "내 정보 변경하기" 버튼은 장바구니 모달에도 똑같이 붙어 있던 걸 보면
 * 모달 템플릿에 남은 잔재로 보여 옮기지 않았다.
 */
interface TermsDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onAgree: () => void;
}

export function TermsDetailDialog({
  open,
  onOpenChange,
  title,
  onAgree,
}: TermsDetailDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-bg-deam" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-165 -translate-x-1/2 -translate-y-1/2 flex-col bg-bg-default pt-6 pb-6 shadow-[0_2px_12px_rgba(0,0,0,0.12)] outline-none">
          <Dialog.Title className="px-6 text-title-m text-font-dark">
            {title}
          </Dialog.Title>

          <div className="mx-6 mt-3 max-h-90 overflow-y-auto border border-font-dark/10 bg-bg-default p-2 text-body-s text-font-dark-subtle">
            {/* TODO: 법무 검수 완료된 약관 원문으로 교체 */}
            <p>
              이 약관 전문은 아직 법무 검수가 완료되지 않아 실제 내용을 담고
              있지 않습니다. 검수가 끝나는 대로 실제 약관 내용으로 교체될
              예정입니다.
            </p>
          </div>

          <div className="mt-9 flex gap-2.5 px-6">
            <Dialog.Close
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="xl"
                  className="w-40"
                >
                  닫기
                </Button>
              }
            />
            <Button
              type="button"
              size="xl"
              className="flex-1"
              onClick={onAgree}
            >
              {title}에 동의하기
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
