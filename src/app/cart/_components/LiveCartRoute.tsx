"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { ArtisanOrderGroup } from "@/components/order/ArtisanOrderGroup";
import { OrderSummary } from "@/components/order/OrderSummary";
import { PurchaseStepIndicator } from "@/components/order/PurchaseStepIndicator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Toast } from "@/components/ui/toast";
import { resolveErrorMessage } from "@/constants/error-messages";
import { ApiError } from "@/lib/http/api-error";
import { useCartMutations, useCartQuery } from "@/queries/cart";
import { useAuthStore } from "@/stores/auth";
import { type CartLine, getCartShippingAmount } from "@/types/cart";
import type { CartPreviewLine } from "@/types/purchase-preview";

import { CartDeleteDialog } from "./CartDeleteDialog";
import { CartLoginDialog } from "./CartLoginDialog";
import { CartOptionDialog } from "./CartOptionDialog";
import { CartProductCard } from "./CartProductCard";
export function LiveCartRoute() {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
  const cart = useCartQuery(
    status !== "loading",
    status === "authenticated" ? `member-${user?.id ?? "current"}` : "guest",
  );
  const mutations = useCartMutations();
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [undo, setUndo] = useState<CartLine[]>([]);
  const [error, setError] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [optionLine, setOptionLine] = useState<CartLine | null>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);
  const lines = (cart.data?.lines ?? []).map((line) => ({
    ...line,
    selected: !line.soldOut && (selection[line.lineId] ?? line.selected),
  }));
  const selected = lines.filter((line) => line.selected);
  const available = lines.filter((line) => !line.soldOut);
  async function run(action: () => Promise<void>) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setError("");
    try {
      await action();
    } catch (error) {
      setError(
        error instanceof ApiError
          ? resolveErrorMessage(error.code, error.status)
          : "장바구니를 변경하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  async function remove() {
    const ids = [...deleteIds];
    setDeleteIds([]);
    const removed: CartLine[] = [];
    setUndo([]);
    try {
      for (const id of ids) {
        const line = lines.find((line) => line.lineId === id);
        if (line) {
          await mutations.remove.mutateAsync(Number(id));
          removed.push(line);
        }
      }
    } finally {
      setUndo(removed);
    }
  }
  async function restore() {
    const remaining = [...undo];
    for (const line of undo) {
      await mutations.add.mutateAsync({
        productId: line.productId,
        quantity: line.quantity,
        selectedOptions: line.selectedOptions,
        textInputs: line.textInputs,
      });
      remaining.shift();
      setUndo([...remaining]);
    }
  }
  const loading = status === "loading" || cart.isPending;
  const unavailable = cart.isError || (!loading && !cart.data);
  const amount = selected.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const shipping = getCartShippingAmount(cart.data?.sections ?? [], selected);
  function choose(group: CartPreviewLine[], checked: boolean) {
    setSelection((current) => ({
      ...current,
      ...Object.fromEntries(
        group
          .filter((line) => !line.soldOut)
          .map((line) => [line.lineId, checked]),
      ),
    }));
  }
  async function checkout() {
    const ids = selected.map((line) => line.lineId);
    const latest = await cart.refetch();
    // 현재 백엔드는 selected 변경 API가 없으며 생성 시 true로 고정한다.
    // 오래되었거나 비정상인 서버 항목을 로컬 체크만으로 주문하지 않는다.
    if (
      latest.isError ||
      !ids.every((id) =>
        latest.data?.lines.some(
          (line) => line.lineId === id && line.selected && !line.soldOut,
        ),
      )
    ) {
      setError(
        "선택한 상품의 주문 가능 상태를 확인할 수 없습니다. 장바구니를 확인해 주세요.",
      );
      return;
    }
    router.push(`/checkout/new?items=${ids.join(",")}`);
  }
  return (
    <div className="flex-1 bg-bg-subtle">
      <div className="mx-auto w-full max-w-234 px-6 pt-16 pb-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-title-xl">장바구니</h1>
          <PurchaseStepIndicator current={1} />
        </div>
        {error && (
          <p role="alert" className="mt-4">
            {error}
          </p>
        )}
        {loading || unavailable ? (
          <div className="mt-10 grid items-start gap-6 md:grid-cols-[minmax(0,546px)_318px]">
            <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xs bg-bg-default p-6">
              <p role={unavailable ? "alert" : "status"}>
                {unavailable
                  ? "장바구니를 불러오지 못했습니다."
                  : "장바구니를 불러오는 중입니다."}
              </p>
              {unavailable && (
                <Button variant="outline" onClick={() => void cart.refetch()}>
                  다시 시도
                </Button>
              )}
            </div>
            <OrderSummary productAmount={0} shippingAmount={0} totalAmount={0}>
              <Button size="l" className="w-full" disabled>
                구매하기
              </Button>
            </OrderSummary>
          </div>
        ) : lines.length ? (
          <>
            <div className="mt-6 flex h-10 max-w-136.5 items-center justify-between">
              <Checkbox
                checked={
                  available.length > 0 && selected.length === available.length
                }
                indeterminate={
                  selected.length > 0 && selected.length < available.length
                }
                disabled={pending || !available.length}
                onCheckedChange={(checked) => choose(lines, checked)}
              >
                전체 선택
              </Checkbox>
              <Button
                variant="ghost"
                size="xs"
                disabled={pending || !selected.length}
                onClick={() =>
                  setDeleteIds(selected.map((line) => line.lineId))
                }
              >
                선택 삭제
              </Button>
            </div>
            <div className="mt-1 grid items-start gap-6 md:grid-cols-[minmax(0,546px)_318px]">
              <div className="flex min-w-0 flex-col gap-6">
                {(cart.data?.sections ?? []).map((section) => {
                  const group = lines.filter(
                    (line) => line.artisanId === section.artisanId,
                  );
                  const purchasable = group.filter((line) => !line.soldOut);
                  return group.length ? (
                    <ArtisanOrderGroup
                      key={section.artisanId}
                      artisanName={section.artisanName}
                      onArtisanClick={() =>
                        setError("장인 상세 페이지는 준비 중입니다.")
                      }
                      headerAction={
                        <Checkbox
                          aria-label={`${section.artisanName} 상품 선택`}
                          checked={
                            purchasable.length > 0 &&
                            purchasable.every((line) => line.selected)
                          }
                          indeterminate={
                            purchasable.some((line) => line.selected) &&
                            !purchasable.every((line) => line.selected)
                          }
                          disabled={pending || !purchasable.length}
                          onCheckedChange={(checked) => choose(group, checked)}
                        />
                      }
                    >
                      {group.map((line) => (
                        <CartProductCard
                          key={line.lineId}
                          line={line}
                          showUnavailableDetails
                          pending={pending}
                          onOptions={() => setOptionLine(line)}
                          onSelect={(checked) => choose([line], checked)}
                          onDelete={() => setDeleteIds([line.lineId])}
                          onQuantity={(quantity) => {
                            if (
                              Number.isInteger(quantity) &&
                              quantity > 0 &&
                              quantity !== line.quantity
                            )
                              void run(async () => {
                                await mutations.quantity.mutateAsync({
                                  cartItemId: Number(line.lineId),
                                  quantity,
                                });
                              });
                          }}
                        />
                      ))}
                    </ArtisanOrderGroup>
                  ) : null;
                })}
              </div>
              <OrderSummary
                productAmount={amount}
                shippingAmount={shipping}
                totalAmount={amount + shipping}
              >
                <Button
                  size="l"
                  className="w-full"
                  disabled={pending || !selected.length}
                  onClick={() =>
                    status === "authenticated"
                      ? void run(checkout)
                      : setLoginOpen(true)
                  }
                >
                  {selected.length
                    ? `${selected.length}건 구매하기`
                    : "구매하기"}
                </Button>
              </OrderSummary>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center pt-50">
            <p className="text-body-l">장바구니가 비어있습니다.</p>
            <Button
              size="l"
              className="mt-8 w-67.5"
              onClick={() => router.push("/")}
            >
              상품 보러 가기
            </Button>
          </div>
        )}
        {undo.length > 0 && (
          <div className="fixed bottom-8 left-1/2 z-50 max-w-[calc(100%-32px)] -translate-x-1/2">
            <Toast
              actionLabel="장바구니에 다시 추가"
              onAction={() => {
                if (!pending) void run(restore);
              }}
            >
              상품이 삭제되었습니다.
            </Toast>
          </div>
        )}
        <CartLoginDialog
          open={loginOpen}
          onOpenChange={setLoginOpen}
          onLogin={() => router.push("/login?returnUrl=%2Fcart")}
        />
        {optionLine && (
          <CartOptionDialog
            key={optionLine.lineId}
            open
            onOpenChange={(open) => {
              if (!open) setOptionLine(null);
            }}
            definitions={[]}
            initialValues={[]}
            onApply={() => {}}
            unavailableMessage="상품 옵션 정보와 변경 기능은 준비 중입니다. 현재 선택한 옵션은 아래에서 확인할 수 있습니다."
            currentOptions={optionLine.options}
          />
        )}
        <CartDeleteDialog
          open={deleteIds.length > 0}
          onOpenChange={(open) => {
            if (!open) setDeleteIds([]);
          }}
          onConfirm={() => void run(remove)}
        />
      </div>
    </div>
  );
}
