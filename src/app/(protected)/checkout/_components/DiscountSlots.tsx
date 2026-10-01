"use client";
import { useEffect, useState } from "react";

import {
  applyPreviewBenefits,
  type BenefitInput,
  fetchPreviewBenefits,
} from "@/api/purchase-preview/benefits";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/input-field";
import { Select, SelectItem } from "@/components/ui/select";

import { CheckoutFieldRow } from "./CheckoutFieldRow";
export function DiscountSlots({
  mode = "preview",
  subtotal = 0,
  onApply,
}: {
  mode?: "preview" | "unavailable";
  subtotal?: number;
  onApply?: (input: BenefitInput, discount: number) => void;
}) {
  const [benefits, setBenefits] =
    useState<Awaited<ReturnType<typeof fetchPreviewBenefits>>>();
  const [code, setCode] = useState("");
  const [points, setPoints] = useState("");
  const [coupon, setCoupon] = useState<"none" | "welcome" | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (mode !== "preview") return;
    let active = true;
    void fetchPreviewBenefits()
      .then((data) => {
        if (active) setBenefits(data);
      })
      .catch(() => {
        if (active) setMessage("시연 혜택을 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [mode]);
  async function apply(next: Partial<BenefitInput> = {}) {
    if (mode !== "preview") {
      setMessage(
        "할인 혜택은 현재 준비 중입니다. 결제 금액에는 적용되지 않습니다.",
      );
      return;
    }
    setPending(true);
    const input = {
      subtotal,
      code,
      points: Number(points) || 0,
      coupon: coupon ?? "none",
      ...next,
    };
    try {
      const result = await applyPreviewBenefits(input);
      onApply?.(input, result.discount);
      setMessage(`시연 할인 ${result.discount.toLocaleString("ko-KR")}원 적용`);
    } catch {
      setMessage("시연 코드와 적립금 범위를 확인해 주세요.");
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="space-y-3">
      <h2 className="flex min-h-6 items-center text-title-m">할인/부가결제</h2>
      <div className="space-y-2">
        <CheckoutFieldRow label="할인코드">
          <div className="grid grid-cols-[minmax(0,1fr)_124px] gap-1">
            <InputField
              aria-label="할인코드"
              placeholder="할인코드 입력"
              className="h-9"
              inputClassName="placeholder:text-font-dark-subtle"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button
              type="button"
              disabled={pending}
              size="xs"
              className="h-9 font-semibold"
              onClick={() => void apply()}
            >
              코드적용
            </Button>
          </div>
        </CheckoutFieldRow>
        <CheckoutFieldRow label="적립금">
          <div className="grid grid-cols-[minmax(0,1fr)_124px] gap-1">
            <InputField
              aria-label="적립금"
              placeholder="사용할 금액 입력"
              className="h-9"
              inputClassName="placeholder:text-font-dark-subtle"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              onBlur={() => {
                if (points) void apply();
              }}
              helperText={
                <>
                  사용 가능 적립금 :{" "}
                  <strong>
                    {benefits?.points.toLocaleString("ko-KR") ?? "0"} 원
                  </strong>
                </>
              }
            />
            <Button
              type="button"
              disabled={pending}
              size="xs"
              className="h-9 font-semibold"
              onClick={() => {
                const value = Math.min(benefits?.points ?? 0, subtotal);
                setPoints(String(value));
                void apply({ points: value });
              }}
            >
              전액 사용하기
            </Button>
          </div>
        </CheckoutFieldRow>
        <CheckoutFieldRow label="쿠폰">
          <Select
            ariaLabel="쿠폰"
            className="rounded-none border-border-neutral-subtle"
            items={
              mode === "preview"
                ? [
                    { value: "none", label: "쿠폰 사용 안 함" },
                    {
                      value: "welcome",
                      label: benefits?.coupons[0]?.name ?? "시연 환영 쿠폰",
                    },
                  ]
                : []
            }
            placeholder="사용할 쿠폰 입력"
            value={coupon}
            disabled={pending}
            onValueChange={(value) => {
              const selected = value === "welcome" ? "welcome" : "none";
              setCoupon(selected);
              void apply({ coupon: selected });
            }}
          >
            {mode === "preview" ? (
              <>
                <SelectItem value="none">쿠폰 사용 안 함</SelectItem>
                <SelectItem value="welcome">
                  {benefits?.coupons[0]?.name ?? "시연 환영 쿠폰"}
                </SelectItem>
              </>
            ) : (
              <SelectItem value="unavailable" disabled>
                사용 가능한 쿠폰이 없습니다.
              </SelectItem>
            )}
          </Select>
          <p className="px-2 py-1 text-caption text-font-dark-subtle">
            사용 가능 쿠폰 : <strong>{benefits?.coupons.length ?? 0}매</strong>
          </p>
        </CheckoutFieldRow>
      </div>
      {message && (
        <p role="status" className="text-caption">
          {message}
        </p>
      )}
    </section>
  );
}
