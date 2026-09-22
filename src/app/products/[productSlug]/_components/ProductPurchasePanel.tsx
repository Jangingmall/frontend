"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useRef, useState } from "react";

import { toCartPreviewLines } from "@/app/products/[productSlug]/_lib/purchase-preview";
import {
  addSelection,
  createSelection,
  getMaxSelectionQuantity,
  getSelectionTotal,
  type ProductChoices,
  type PurchaseSelection,
  setSelectionQuantity,
} from "@/app/products/[productSlug]/_lib/purchase-selection";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  CancelIcon,
  ChevronRightIcon,
  HeartFilledIcon,
  HeartIcon,
  ShareIcon,
  StarFilledIcon,
} from "@/components/ui/icons";
import { Select, SelectItem } from "@/components/ui/select";
import { Stepper } from "@/components/ui/stepper";
import { cn } from "@/lib/utils";
import { useCartMutations } from "@/queries/cart";
import { useProductActions } from "@/queries/products/detail-actions";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth";
import { usePurchasePreviewStore } from "@/stores/purchase-preview";
import type { ProductDetail, ProductNotify } from "@/types/product-detail";
import { PURCHASE_PREVIEW_ORDER_ID } from "@/types/purchase-preview";

const money = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;
const NO_OPTION = "__no_option__";

interface ProductPurchasePanelProps {
  product: ProductDetail;
  onNotify: ProductNotify;
  onRequireLogin: (confirm?: boolean) => void;
  notice?: ReactNode;
}

export function ProductPurchasePanel({
  product,
  onNotify,
  onRequireLogin,
  notice,
}: ProductPurchasePanelProps) {
  const router = useRouter();
  const cart = useCartMutations();
  const submitting = useRef(false);
  const [mergedPurchase, setMergedPurchase] = useState<{
    id: string;
    quantity: number;
  } | null>(null);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const actions = useProductActions(product.id, userId, isAuthenticated);
  const [choices, setChoices] = useState<ProductChoices>({});
  const [lines, setLines] = useState<PurchaseSelection[]>(() => {
    const initial = product.optionGroups.length
      ? null
      : createSelection(product, {});
    return initial ? [initial] : [];
  });
  const [lastSelectionKey, setLastSelectionKey] = useState<string | null>(
    lines[0]?.key ?? null,
  );
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const soldOut = product.status === "SOLD_OUT" || product.stock === 0;
  const unknownStock = product.stock === null;
  const groups = product.optionGroups;
  const missingGroups = groups.filter((group) => !choices[group.id]);
  const busy =
    actions.cart.isPending || actions.restock.isPending || cart.add.isPending;
  const unsupportedOptions = !product.isMock && groups.length > 0;
  const wished = isAuthenticated && (actions.state.data?.wished ?? false);

  function handleChoose(index: number, value: string | null) {
    if (value === null) return;
    const group = groups[index];
    const next: ProductChoices = Object.fromEntries(
      groups
        .slice(0, index)
        .filter((item) => choices[item.id])
        .map((item) => [item.id, choices[item.id]]),
    );
    next[group.id] = value;
    setChoices(next);
    setHasError(false);
    const nextGroup = groups[index + 1];
    setOpenGroup(nextGroup?.id ?? null);
    const cleanChoices = Object.fromEntries(
      Object.entries(next).filter(([, id]) => id !== NO_OPTION),
    );
    // 선택 옵션도 '선택 안 함'으로 확정한 뒤 조합을 추가한다.
    if (groups.some((item) => !next[item.id])) {
      setLastSelectionKey(null);
      return;
    }
    const selection = createSelection(product, cleanChoices);
    if (!selection) {
      onNotify("선택한 옵션은 현재 구매할 수 없습니다.");
      return;
    }
    const existing = lines.find((line) => line.key === selection.key);
    const maximum = getMaxSelectionQuantity(
      product,
      existing ? lines : [...lines, selection],
      selection.key,
    );
    if (maximum < 1 || (existing && existing.quantity >= maximum)) {
      onNotify("구매 가능한 최대 수량입니다.");
      return;
    }
    setLines(addSelection(lines, selection, product));
    setLastSelectionKey(selection.key);
  }

  function validatePurchase(confirmLogin = false) {
    if (!lines.length) {
      setHasError(true);
      if (missingGroups.length) {
        const index = groups.findIndex(
          (group) => group.id === missingGroups[0].id,
        );
        optionRefs.current[index]
          ?.querySelector<HTMLButtonElement>("button")
          ?.focus();
        onNotify("옵션을 선택하지 않았습니다");
      } else onNotify("구매할 옵션을 다시 선택해 주세요.");
      return false;
    }
    if (!isAuthenticated) {
      onRequireLogin(confirmLogin);
      return false;
    }
    return true;
  }

  async function handleLivePurchase(checkout: boolean) {
    if (
      submitting.current ||
      busy ||
      soldOut ||
      unknownStock ||
      unsupportedOptions ||
      product.status !== "ON_SALE"
    )
      return;
    if (!lines.length) {
      onNotify("구매할 작품을 추가해 주세요.");
      return;
    }
    if (checkout && !isAuthenticated) {
      onRequireLogin(true);
      return;
    }
    submitting.current = true;
    try {
      const result = await cart.add.mutateAsync({
        productId: product.id,
        quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
      });
      const added = result.lines.filter(
        (line) =>
          line.productId === product.id &&
          !line.selectedOptions.length &&
          !line.textInputs.length,
      );
      if (checkout) {
        if (added.length !== 1 || added[0].soldOut) {
          onNotify("장바구니에 담긴 작품 상태를 확인해 주세요.", {
            label: "장바구니 보기",
            onClick: () => router.push("/cart"),
          });
          return;
        }
        const requestedQuantity = lines.reduce(
          (sum, line) => sum + line.quantity,
          0,
        );
        if (added[0].quantity !== requestedQuantity) {
          setMergedPurchase({
            id: added[0].lineId,
            quantity: added[0].quantity,
          });
          return;
        }
        router.push(`/checkout/new?items=${added[0].lineId}`);
      } else {
        onNotify("장바구니에 작품을 담았습니다.", {
          label: "장바구니 보기",
          onClick: () => router.push("/cart"),
        });
      }
    } catch {
      onNotify(
        "장바구니에 담지 못했습니다. 재고와 수량을 확인하고 다시 시도해 주세요.",
      );
    } finally {
      submitting.current = false;
    }
  }

  function handlePurchase(checkout = false) {
    if (!product.isMock) {
      void handleLivePurchase(checkout);
      return;
    }
    if (!validatePurchase(true) || busy) return;
    const snapshot = toCartPreviewLines(product, lines);
    actions.cart.mutate(
      lines.map(({ choices, quantity }) => ({ choices, quantity })),
      {
        onSuccess: () => {
          if (useAuthStore.getState().user?.id !== userId) return;
          if (checkout) {
            usePurchasePreviewStore.getState().beginCheckout(snapshot);
            router.push(`/checkout/${PURCHASE_PREVIEW_ORDER_ID}` as Route);
            return;
          }
          // 삭제 후 다시 담기도 허용하도록 현재 카트를 기준으로 중복을 판정한다.
          const duplicate = usePurchasePreviewStore
            .getState()
            .addLines(snapshot);
          onNotify(
            duplicate
              ? "이미 장바구니에 담긴 작품입니다."
              : "장바구니에 작품을 담았습니다.",
            {
              label: "장바구니 보기",
              onClick: () => router.push("/cart"),
            },
          );
        },
        onError: () =>
          onNotify("장바구니에 담지 못했습니다. 옵션과 재고를 확인해 주세요."),
      },
    );
  }

  function handleWishlist() {
    if (!isAuthenticated) {
      onRequireLogin(true);
      return;
    }
    if (actions.wishlist.isPending || actions.state.isFetching) return;
    if (!actions.state.data || actions.state.isError) {
      void actions.state.refetch();
      onNotify("찜 상태를 다시 확인하고 있습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    actions.wishlist.mutate(!wished, {
      onSuccess: () =>
        onNotify(
          wished ? "찜한 작품에서 삭제했습니다." : "찜한 작품에 추가했습니다.",
        ),
      onError: () => onNotify("찜을 변경하지 못했습니다. 다시 시도해 주세요."),
    });
  }

  function handleRestock() {
    if (!product.isMock) return;
    if (!isAuthenticated) {
      onRequireLogin(false);
      return;
    }
    if (!product.isMock) {
      onNotify("재입고 알림 기능은 준비 중입니다.");
      return;
    }
    actions.restock.mutate(undefined, {
      onSuccess: ({ duplicate }) =>
        onNotify(
          duplicate
            ? "이미 재입고 알림을 신청한 작품입니다."
            : "재입고 알림을 신청했습니다.",
        ),
      onError: () =>
        onNotify("재입고 알림을 신청하지 못했습니다. 다시 시도해 주세요."),
    });
  }

  async function handleShare() {
    try {
      const canonical =
        document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
          ?.href ?? `${window.location.origin}${window.location.pathname}`;
      await navigator.clipboard.writeText(canonical);
      onNotify("작품 링크를 복사했습니다.");
    } catch {
      onNotify("링크를 복사하지 못했습니다. 주소창의 링크를 복사해 주세요.");
    }
  }

  return (
    <section
      aria-label="작품 구매 정보"
      className="flex min-w-0 flex-col gap-6 bg-bg-default text-font-dark"
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 self-center text-title-xl font-bold break-keep">
              {product.name}
            </h1>
            <div className="flex shrink-0">
              <Button
                variant="ghost"
                size="xs"
                className="size-10 p-1"
                aria-label={wished ? "찜 취소" : "찜하기"}
                aria-pressed={wished}
                disabled={
                  actions.wishlist.isPending ||
                  (isAuthenticated && actions.state.isFetching)
                }
                onClick={handleWishlist}
              >
                {wished ? (
                  <HeartFilledIcon className="size-8" />
                ) : (
                  <HeartIcon className="size-8" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="xs"
                className="size-10 p-1"
                aria-label="작품 링크 공유"
                onClick={handleShare}
              >
                <ShareIcon className="size-8" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            {product.artisan ? (
              product.artisan.href ? (
                <Link
                  className="flex min-w-0 items-center text-body-l leading-normal font-medium text-font-dark-weak"
                  href={{ pathname: product.artisan.href }}
                >
                  {product.artisan.name}
                  <ChevronRightIcon className="size-5" />
                </Link>
              ) : (
                <span className="text-body-l leading-normal font-medium text-font-dark-weak">
                  {product.artisan.name}
                </span>
              )
            ) : (
              <span />
            )}
            {product.rating !== null && (
              <a
                href="#product-reviews"
                className="flex shrink-0 items-center text-body-m text-font-label"
                aria-label={`평점 ${product.rating.toFixed(1)}, 후기 ${product.reviewCount}개`}
              >
                <StarFilledIcon className="size-5" />
                {product.rating.toFixed(1)}
              </a>
            )}
          </div>
        </div>
        <p className="text-title-m font-bold">{money(product.price)}</p>
      </div>
      <p className="text-body-m whitespace-pre-line">{product.description}</p>
      <div className="flex flex-col gap-2 border-t border-border-neutral-weak pt-6">
        {product.shipping && (
          <dl className="grid grid-cols-[66px_1fr] gap-x-6 gap-y-2 text-body text-font-dark-subtle">
            <dt className="font-bold text-font-dark-secondary">배송비</dt>
            <dd>
              {product.shipping.fee === null
                ? "배송비 확인 필요"
                : product.shipping.fee === 0
                  ? "무료배송"
                  : money(product.shipping.fee)}
              {product.shipping.freeAbove !== null &&
                ` (${money(product.shipping.freeAbove)} 이상 무료)`}
            </dd>
            {product.shipping.productionDays && (
              <>
                <dt className="font-bold text-font-dark-secondary">
                  제작 기간
                </dt>
                <dd>{product.shipping.productionDays}</dd>
              </>
            )}
          </dl>
        )}
        {groups.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-body font-bold text-font-dark-secondary">
              선택 ({Object.values(choices).filter(Boolean).length}/
              {groups.length})
            </p>
            <div className="flex flex-col gap-1">
              {groups.map((group, index) => {
                const items = [
                  ...(!group.required &&
                  !group.values.some((value) => value.label === "선택 안 함")
                    ? [{ value: NO_OPTION, label: "선택 안 함" }]
                    : []),
                  ...group.values.map((value) => ({
                    value: value.id,
                    label: `${value.label}${value.priceDelta ? ` (+${money(value.priceDelta)})` : ""}`,
                  })),
                ];
                return (
                  <div
                    key={group.id}
                    ref={(element) => {
                      optionRefs.current[index] = element;
                    }}
                  >
                    <Select
                      ariaLabel={`${group.label}${group.required ? " (필수)" : " (선택)"}`}
                      placeholder={`${index + 1}. ${group.label}${group.required ? " (필수)" : " (선택)"}`}
                      items={items}
                      value={choices[group.id] ?? null}
                      open={openGroup === group.id}
                      onOpenChange={(open) =>
                        setOpenGroup((current) =>
                          open
                            ? group.id
                            : current === group.id
                              ? null
                              : current,
                        )
                      }
                      onValueChange={(value) => handleChoose(index, value)}
                      disabled={
                        soldOut ||
                        unknownStock ||
                        groups
                          .slice(0, index)
                          .some((previous) => !choices[previous.id])
                      }
                      className={cn(
                        choices[group.id] && "font-bold",
                        hasError && !choices[group.id] && "border-red-border",
                      )}
                    >
                      {items.map((item) => {
                        const stock = group.values.find(
                          (value) => value.id === item.value,
                        )?.stock;
                        return (
                          <SelectItem
                            key={item.value}
                            value={item.value}
                            disabled={stock === 0 || stock === null}
                          >
                            {item.label}
                          </SelectItem>
                        );
                      })}
                    </Select>
                  </div>
                );
              })}
            </div>
            {hasError && missingGroups.length > 0 && (
              <p className="text-body-s text-red-font">
                옵션을 선택해 주세요. 선물 포장은 선택 안 함을 고를 수 있습니다.
              </p>
            )}
          </div>
        )}
      </div>
      {!groups.length && !lines.length && !soldOut && !unknownStock && (
        <Button
          variant="outline"
          size="s"
          onClick={() => {
            const selection = createSelection(product, {});
            if (selection) setLines([selection]);
          }}
        >
          작품 추가
        </Button>
      )}
      {lines.length > 0 && (
        <div
          className="flex flex-col gap-2 border-t border-border-neutral-weak pt-6"
          aria-label="선택한 옵션"
        >
          {lines.map((line) => (
            <div key={line.key} className="bg-bg-subtle px-3 pt-3 pb-2">
              <div className="mb-1 flex items-start justify-between gap-3">
                <p className="text-body-s font-bold">{product.name}</p>
                <Button
                  variant="ghost"
                  size="xs"
                  className="size-5 min-w-0 p-0"
                  aria-label={`${line.label} 삭제`}
                  onClick={() => {
                    setLines(lines.filter((item) => item.key !== line.key));
                    if (lastSelectionKey === line.key) {
                      setLastSelectionKey(null);
                      setChoices({});
                    }
                  }}
                >
                  <CancelIcon className="size-5" />
                </Button>
              </div>
              <ul className="flex flex-col gap-1 text-caption text-font-label">
                {groups.map((group) => (
                  <li key={group.id}>
                    - {group.label}: {line.optionLabels[group.id]}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-end gap-4 border-t border-border-jade-weak pt-1">
                <Stepper
                  size="s"
                  min={1}
                  max={getMaxSelectionQuantity(product, lines, line.key)}
                  step={1}
                  value={line.quantity}
                  aria-label={`${line.label} 수량`}
                  onValueChange={(quantity) =>
                    setLines(
                      setSelectionQuantity(
                        lines,
                        line.key,
                        quantity ?? 1,
                        product,
                      ),
                    )
                  }
                />
                <span className="text-body-s font-bold">
                  {money(line.unitPrice * line.quantity)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-6 border-t border-border-neutral-weak pt-6">
        <div className="relative">
          <p className="flex items-center justify-end gap-3">
            <span className="text-body-s text-font-dark-subtle">
              총 상품 금액
            </span>
            <strong
              className="text-title-m font-bold"
              aria-live="polite"
              data-testid="purchase-total"
            >
              {money(getSelectionTotal(lines))}
            </strong>
          </p>
          {notice && (
            <div className="absolute inset-x-0 bottom-0 z-10">{notice}</div>
          )}
        </div>
        {unknownStock && (
          <p className="text-body-s text-font-dark-weak">
            재고를 확인 중입니다.
          </p>
        )}
        {!product.isMock && (soldOut || unsupportedOptions) && (
          <p className="text-body-s text-font-dark-weak">
            {soldOut
              ? "재입고 알림은 아직 지원하지 않습니다."
              : "이 작품의 옵션 구매는 아직 지원하지 않습니다."}
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="xl"
            className="w-2/5 min-w-0 border-border-neutral-solid px-3 xl:w-50"
            disabled={
              unsupportedOptions ||
              (!product.isMock && soldOut) ||
              (unknownStock && !soldOut)
            }
            loading={busy}
            onClick={soldOut ? handleRestock : () => handlePurchase()}
          >
            {soldOut ? "재입고 알림" : "장바구니"}
          </Button>
          <Button
            size="xl"
            className="min-w-0 flex-1 px-3"
            disabled={unsupportedOptions || soldOut || unknownStock || busy}
            onClick={() => handlePurchase(true)}
          >
            {soldOut ? "품절" : "구매하기"}
          </Button>
        </div>
      </div>
      <Dialog
        open={mergedPurchase !== null}
        onOpenChange={(open) => {
          if (!open) setMergedPurchase(null);
        }}
        variant="confirmation"
        title="장바구니에 같은 작품이 있습니다"
        description={`기존 수량을 포함해 총 ${mergedPurchase?.quantity ?? 0}개가 담겨 있습니다. 이 수량으로 주문하시겠습니까?`}
      >
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/cart")}
          >
            수량 확인하기
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              if (mergedPurchase)
                router.push(`/checkout/new?items=${mergedPurchase.id}`);
            }}
          >
            주문 계속하기
          </Button>
        </div>
      </Dialog>
    </section>
  );
}

