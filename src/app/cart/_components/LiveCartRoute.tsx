"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { ArtisanOrderGroup } from "@/components/order/ArtisanOrderGroup";
import { OrderSummary } from "@/components/order/OrderSummary";
import { PurchaseStepIndicator } from "@/components/order/PurchaseStepIndicator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { resolveErrorMessage } from "@/constants/error-messages";
import { ApiError } from "@/lib/http/api-error";
import { useCartMutations, useCartQuery } from "@/queries/cart";
import { useAuthStore } from "@/stores/auth";
import { type CartLine, getCartShippingAmount } from "@/types/cart";
import type { CartPreviewLine } from "@/types/purchase-preview";

import { CartDeleteDialog } from "./CartDeleteDialog";
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
  if (status === "loading" || cart.isPending)
    return (
      <div role="status" className="p-16 text-center">
        장바구니를 불러오는 중입니다.
      </div>
    );
  if (cart.isError || !cart.data)
    return (
      <div role="alert" className="p-16 text-center">
        <p>장바구니를 불러오지 못했습니다.</p>
        <Button onClick={() => void cart.refetch()}>다시 시도</Button>
      </div>
    );
  const amount = selected.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const shipping = getCartShippingAmount(cart.data.sections, selected);
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
  return (
    <div className="flex-1 bg-bg-subtle">
      <div className="mx-auto w-full max-w-234 px-6 pt-16 pb-50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-title-xl">장바구니</h1>
          <PurchaseStepIndicator current={1} />
        </div>
        <p className="mt-4 text-body-s">
          현재 상품 옵션 변경은 지원되지 않습니다. 수량 변경과 상품 삭제를
          이용해 주세요.
        </p>
        {error && (
          <p role="alert" className="mt-4">
            {error}
          </p>
        )}
        {lines.length ? (
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
                {cart.data.sections.map((section) => {
                  const group = lines.filter(
                    (line) => line.artisanId === section.artisanId,
                  );
                  const purchasable = group.filter((line) => !line.soldOut);
                  return group.length ? (
                    <ArtisanOrderGroup
                      key={section.artisanId}
                      artisanName={section.artisanName}
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
                          pending={pending}
                          optionsDisabled
                          onOptions={() => {}}
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
                    router.push(
                      status === "authenticated"
                        ? `/checkout/new?items=${selected.map((line) => line.lineId).join(",")}`
                        : "/login?returnUrl=%2Fcart",
                    )
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
          <div role="status" className="mt-6 flex items-center gap-4">
            <span>상품이 삭제되었습니다.</span>
            <Button disabled={pending} onClick={() => void run(restore)}>
              장바구니에 다시 추가
            </Button>
          </div>
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
