"use client";
import { useEffect, useRef, useState } from "react";

import {
  CART_PREVIEW_SHIPPING_AMOUNT,
  getCartOptions,
} from "@/app/cart/_lib/cart-fixtures";
import {
  changeQuantity,
  getPurchasableLines,
  getSelectedAmount,
  type RemovedLine,
  removeLines,
  restoreLines,
  setSelection,
} from "@/app/cart/_lib/cart-selection";
import { ArtisanOrderGroup } from "@/components/order/ArtisanOrderGroup";
import { OrderSummary } from "@/components/order/OrderSummary";
import { PurchaseStepIndicator } from "@/components/order/PurchaseStepIndicator";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import type { CartPreviewLine } from "@/types/purchase-preview";

import { CartDeleteDialog } from "./CartDeleteDialog";
import { CartLoginDialog } from "./CartLoginDialog";
import { CartOptionDialog } from "./CartOptionDialog";
import { CartProductCard } from "./CartProductCard";
export interface CartPageProps {
  initialLines: CartPreviewLine[];
  authenticated?: boolean;
  onLinesChange?: (lines: CartPreviewLine[]) => void;
  onCheckout?: (lines: CartPreviewLine[]) => void;
  onLogin?: () => void;
  onHome?: () => void;
  onArtisanClick?: (id: number) => void;
}
export function CartPage({
  initialLines,
  authenticated = false,
  onLinesChange,
  onCheckout,
  onLogin,
  onHome,
  onArtisanClick,
}: CartPageProps) {
  const [lines, setLines] = useState(initialLines);
  const [deleteIds, setDeleteIds] = useState<string[]>([]);
  const [undo, setUndo] = useState<RemovedLine[]>([]);
  const [optionLine, setOptionLine] = useState<CartPreviewLine | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    onLinesChange?.(lines);
  }, [lines, onLinesChange]);
  useEffect(() => {
    if (!undo.length) return;
    const timeout = window.setTimeout(() => setUndo([]), 8000);
    return () => window.clearTimeout(timeout);
  }, [undo]);
  const purchasable = getPurchasableLines(lines);
  const selected = purchasable.filter((line) => line.selected);
  const amount = getSelectedAmount(lines);
  const shipping = selected.length ? CART_PREVIEW_SHIPPING_AMOUNT : 0;
  const artisanIds = [...new Set(lines.map((line) => line.artisanId))];
  function rememberTrigger() {
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
  }
  function restoreFocus() {
    requestAnimationFrame(
      () => trigger.current?.isConnected && trigger.current.focus(),
    );
  }
  function requestDelete(ids: string[]) {
    rememberTrigger();
    setDeleteIds(ids);
  }
  function purchase() {
    if (!selected.length) return;
    if (!authenticated) {
      rememberTrigger();
      setLoginOpen(true);
    } else if (onCheckout) onCheckout(selected);
    else setNotice("주문·결제 화면은 준비 중입니다.");
  }
  return (
    <div className="flex-1 bg-bg-subtle">
      <div
        className={cn(
          "mx-auto w-full max-w-234 px-6 pt-16",
          lines.length ? "pb-50" : "pb-70",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-title-xl">장바구니</h1>
          <PurchaseStepIndicator current={1} />
        </div>
        {lines.length ? (
          <>
            <div className="mt-6 flex h-10 max-w-136.5 items-center justify-between">
              <Checkbox
                checked={
                  purchasable.length > 0 &&
                  selected.length === purchasable.length
                }
                indeterminate={
                  selected.length > 0 && selected.length < purchasable.length
                }
                disabled={!purchasable.length}
                onCheckedChange={(checked) =>
                  setLines(setSelection(lines, checked))
                }
              >
                전체 선택
              </Checkbox>
              <Button
                variant="ghost"
                size="xs"
                className="text-caption underline"
                disabled={!selected.length}
                onClick={() =>
                  requestDelete(selected.map((line) => line.lineId))
                }
              >
                선택 삭제
              </Button>
            </div>
            <div className="mt-1 grid items-start gap-6 md:grid-cols-[minmax(0,546px)_318px]">
              <div className="flex min-w-0 flex-col gap-6">
                {artisanIds.map((id) => {
                  const group = lines.filter((line) => line.artisanId === id);
                  const available = getPurchasableLines(group);
                  const chosen = available.filter((line) => line.selected);
                  return (
                    <ArtisanOrderGroup
                      key={id}
                      artisanName={group[0].artisanName}
                      onArtisanClick={() =>
                        onArtisanClick
                          ? onArtisanClick(id)
                          : setNotice("장인 상세페이지는 준비 중입니다.")
                      }
                      headerAction={
                        <Checkbox
                          aria-label={`${group[0].artisanName} 상품 선택`}
                          checked={
                            available.length > 0 &&
                            chosen.length === available.length
                          }
                          indeterminate={
                            chosen.length > 0 &&
                            chosen.length < available.length
                          }
                          disabled={!available.length}
                          onCheckedChange={(checked) =>
                            setLines(setSelection(lines, checked, id))
                          }
                        />
                      }
                    >
                      {group.map((line) => (
                        <CartProductCard
                          key={line.lineId}
                          line={line}
                          onSelect={(checked) =>
                            setLines(
                              lines.map((item) =>
                                item.lineId === line.lineId
                                  ? { ...item, selected: checked }
                                  : item,
                              ),
                            )
                          }
                          onQuantity={(value) =>
                            setLines(changeQuantity(lines, line.lineId, value))
                          }
                          onDelete={() => requestDelete([line.lineId])}
                          onOptions={() => {
                            rememberTrigger();
                            setOptionLine(line);
                          }}
                        />
                      ))}
                    </ArtisanOrderGroup>
                  );
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
                  disabled={!selected.length}
                  onClick={purchase}
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
            <Button size="l" className="mt-8 w-67.5" onClick={onHome}>
              상품 보러 가기
            </Button>
          </div>
        )}
      </div>
      <CartDeleteDialog
        open={deleteIds.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteIds([]);
            restoreFocus();
          }
        }}
        onConfirm={() => {
          const result = removeLines(lines, deleteIds);
          setLines(result.remaining);
          setUndo(result.snapshot);
          setDeleteIds([]);
          restoreFocus();
        }}
      />
      <CartLoginDialog
        open={loginOpen}
        onOpenChange={(open) => {
          setLoginOpen(open);
          if (!open) restoreFocus();
        }}
        onLogin={() => onLogin?.()}
      />
      {optionLine && (
        <CartOptionDialog
          key={optionLine.lineId}
          open
          onOpenChange={(open) => {
            if (!open) {
              setOptionLine(null);
              restoreFocus();
            }
          }}
          initialValues={optionLine.options}
          definitions={getCartOptions(optionLine.productId)}
          onApply={(options) =>
            setLines(
              lines.map((line) =>
                line.lineId === optionLine.lineId ? { ...line, options } : line,
              ),
            )
          }
        />
      )}
      {undo.length > 0 && (
        <div className="fixed inset-x-4 bottom-6 z-40 flex justify-center">
          <Toast
            actionLabel="장바구니에 다시 추가"
            onAction={() => {
              setLines(restoreLines(lines, undo));
              setUndo([]);
            }}
            className="h-auto min-h-10 max-w-full flex-wrap justify-center gap-y-2 py-2 [&>span]:px-2"
          >
            상품이 삭제되었습니다.
          </Toast>
        </div>
      )}
      {notice && (
        <div className="fixed inset-x-4 bottom-18 z-40 flex justify-center">
          <Toast actionLabel="닫기" onAction={() => setNotice("")}>
            {notice}
          </Toast>
        </div>
      )}
    </div>
  );
}
