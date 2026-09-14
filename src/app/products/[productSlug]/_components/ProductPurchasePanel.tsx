"use client";

import Link from "next/link";
import { useRef, useState } from "react";

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
import { useProductActions } from "@/queries/products/detail-actions";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth";
import type { ProductDetail, ProductNotify } from "@/types/product-detail";

const money = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;
const NO_OPTION = "__no_option__";

interface ProductPurchasePanelProps {
  product: ProductDetail;
  onNotify: ProductNotify;
  onRequireLogin: () => void;
}

export function ProductPurchasePanel({
  product,
  onNotify,
  onRequireLogin,
}: ProductPurchasePanelProps) {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const actions = useProductActions(
    product.id,
    userId,
    isAuthenticated && product.isMock,
  );
  const [choices, setChoices] = useState<ProductChoices>({});
  const [lines, setLines] = useState<PurchaseSelection[]>(() => {
    const initial = product.optionGroups.some((group) => group.required)
      ? null
      : createSelection(product, {});
    return initial ? [initial] : [];
  });
  const [editingKey, setEditingKey] = useState<string | null>(
    lines[0]?.key ?? null,
  );
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const soldOut = product.status === "SOLD_OUT" || product.stock === 0;
  const unknownStock = product.stock === null;
  const groups = product.optionGroups;
  const requiredMissing = groups.filter(
    (group) => group.required && !choices[group.id],
  );
  const busy = actions.cart.isPending || actions.restock.isPending;
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
    if (groups.some((item) => item.required && !cleanChoices[item.id])) {
      setEditingKey(null);
      return;
    }
    const selection = createSelection(product, cleanChoices);
    if (!selection) {
      onNotify("선택한 옵션은 현재 구매할 수 없습니다.");
      return;
    }
    // 선물 포장은 방금 만든 일반 옵션 카드에 반영한다. 별도 상품으로 중복 추가하지 않는다.
    const edited =
      group.kind === "GIFT"
        ? lines.find((line) => line.key === editingKey)
        : undefined;
    const retained = edited
      ? lines.filter((line) => line.key !== edited.key)
      : lines;
    const existing = retained.find((line) => line.key === selection.key);
    const maximum = getMaxSelectionQuantity(
      product,
      existing ? retained : [...retained, selection],
      selection.key,
    );
    if (maximum < 1 || (existing && existing.quantity >= maximum)) {
      onNotify("구매 가능한 최대 수량입니다.");
      return;
    }
    const updated = addSelection(retained, selection, product);
    setLines(
      edited
        ? setSelectionQuantity(
            updated,
            selection.key,
            (existing?.quantity ?? 0) + edited.quantity,
            product,
          )
        : updated,
    );
    setEditingKey(selection.key);
  }

  function validatePurchase() {
    if (!lines.length) {
      setHasError(true);
      if (requiredMissing.length) {
        const index = groups.findIndex(
          (group) => group.id === requiredMissing[0].id,
        );
        optionRefs.current[index]
          ?.querySelector<HTMLButtonElement>("button")
          ?.focus();
        onNotify("필수 옵션을 선택해 주세요.");
      } else onNotify("구매할 옵션을 다시 선택해 주세요.");
      return false;
    }
    if (!isAuthenticated) {
      onRequireLogin();
      return false;
    }
    return true;
  }

  function handleCart() {
    if (!validatePurchase() || busy) return;
    actions.cart.mutate(
      lines.map(({ choices, quantity }) => ({ choices, quantity })),
      {
        onSuccess: ({ duplicate }) =>
          onNotify(
            duplicate
              ? "이미 장바구니에 담긴 작품입니다."
              : "장바구니에 작품을 담았습니다.",
            {
              label: "장바구니 보기",
              onClick: () => onNotify("장바구니 화면은 준비 중입니다."),
            },
          ),
        onError: () =>
          onNotify(
            product.isMock
              ? "장바구니에 담지 못했습니다. 옵션과 재고를 확인해 주세요."
              : "장바구니 기능은 준비 중입니다.",
          ),
      },
    );
  }

  function handleWishlist() {
    if (!isAuthenticated) {
      onRequireLogin();
      return;
    }
    if (!product.isMock) {
      onNotify("찜 기능은 준비 중입니다.");
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
    if (!isAuthenticated) {
      onRequireLogin();
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
        onNotify(
          product.isMock
            ? "재입고 알림을 신청하지 못했습니다. 다시 시도해 주세요."
            : "재입고 알림 기능은 준비 중입니다.",
        ),
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
            <h1 className="min-w-0 self-center text-title-xl break-keep">
              {product.name}
            </h1>
            <div className="flex shrink-0">
              <Button
                variant="ghost"
                size="xs"
                className="size-10 p-1"
                aria-label={wished ? "찜 취소" : "찜하기"}
                aria-pressed={wished}
                disabled={actions.wishlist.isPending}
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
                  className="flex min-w-0 items-center text-body-l text-font-dark-weak"
                  href={{ pathname: product.artisan.href }}
                >
                  {product.artisan.name}
                  <ChevronRightIcon className="size-5" />
                </Link>
              ) : (
                <span className="text-body-l text-font-dark-weak">
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
        <p className="text-title-m">₩{product.price.toLocaleString("ko-KR")}</p>
      </div>
      <p className="text-body-m whitespace-pre-line">{product.description}</p>
      <div className="flex flex-col gap-2 border-t border-border-neutral-weak pt-6">
        {product.shipping && (
          <dl className="grid grid-cols-[66px_1fr] gap-x-6 gap-y-2 text-body-s text-font-dark-subtle">
            <dt className="font-bold">배송비</dt>
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
                <dt className="font-bold">제작 기간</dt>
                <dd>{product.shipping.productionDays}</dd>
              </>
            )}
          </dl>
        )}
        {groups.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-body-s font-bold">
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
                          .some(
                            (previous) =>
                              previous.required && !choices[previous.id],
                          )
                      }
                      className={cn(
                        choices[group.id] && "font-bold",
                        hasError &&
                          group.required &&
                          !choices[group.id] &&
                          "border-red-border",
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
            {hasError && requiredMissing.length > 0 && (
              <p className="text-body-s text-red-font">
                필수 옵션을 선택해 주세요.
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
                    if (editingKey === line.key) {
                      setEditingKey(null);
                      setChoices({});
                    }
                  }}
                >
                  <CancelIcon className="size-5" />
                </Button>
              </div>
              <ul className="flex flex-col gap-1 text-caption text-font-label">
                {groups
                  .filter((group) => line.choices[group.id])
                  .map((group) => (
                    <li key={group.id}>
                      - {group.label}:{" "}
                      {
                        group.values.find(
                          (value) => value.id === line.choices[group.id],
                        )?.label
                      }
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
        <p className="flex items-center justify-end gap-3">
          <span className="text-body-s text-font-dark-subtle">
            총 상품 금액
          </span>
          <strong
            className="text-title-m"
            aria-live="polite"
            data-testid="purchase-total"
          >
            {money(getSelectionTotal(lines))}
          </strong>
        </p>
        {unknownStock && (
          <p className="text-body-s text-font-dark-weak">
            재고를 확인 중입니다.
          </p>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="xl"
            className="w-2/5 min-w-0 px-3 text-body-l xl:w-50"
            disabled={unknownStock}
            loading={busy}
            onClick={soldOut ? handleRestock : handleCart}
          >
            {soldOut ? "재입고 알림" : "장바구니"}
          </Button>
          <Button
            size="xl"
            className="min-w-0 flex-1 px-3 text-body-l"
            disabled={soldOut || unknownStock}
            onClick={() => {
              if (validatePurchase())
                onNotify("주문·결제 기능은 준비 중입니다.");
            }}
          >
            {soldOut ? "품절" : "구매하기"}
          </Button>
        </div>
      </div>
    </section>
  );
}
