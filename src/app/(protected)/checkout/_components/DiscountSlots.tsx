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
  onPreview,
  subtotal = 0,
  onApply,
}: {
  onPreview?: () => void;
  subtotal?: number;
  onApply?: (input: BenefitInput, discount: number) => void;
}) {
  const [benefits, setBenefits] =
    useState<Awaited<ReturnType<typeof fetchPreviewBenefits>>>();
  const [code, setCode] = useState("");
  const [points, setPoints] = useState("");
  const [coupon, setCoupon] = useState<"none" | "welcome">("none");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (onPreview) return;
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
  }, [onPreview]);
  async function apply(next: Partial<BenefitInput> = {}) {
    if (onPreview) {
      onPreview();
      return;
    }
    setPending(true);
    const input = {
      subtotal,
      code,
      points: Number(points) || 0,
      coupon,
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
      <h2 className="text-title-m">할인/부가결제</h2>
      <p className="text-caption">
        {onPreview
          ? "할인 기능을 선택하면 실제 결제 없이 주문 전체를 시연합니다."
          : `시연 전용 · 코드 ${benefits?.code ?? "…"}`}
      </p>
      <div className="space-y-2">
        <CheckoutFieldRow label="할인코드">
          <div className="grid grid-cols-[minmax(0,1fr)_124px] gap-1">
            <InputField
              aria-label="할인코드"
              placeholder="할인코드 입력"
              className="h-9"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button
              type="button"
              disabled={pending}
              size="xs"
              className="h-9"
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
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              onBlur={() => {
                if (points) void apply();
              }}
              helperText={`사용 가능 적립금 : ${benefits?.points.toLocaleString("ko-KR") ?? "시연에서 확인"} 원`}
            />
            <Button
              type="button"
              disabled={pending}
              size="xs"
              className="h-9"
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
            items={[
              { value: "none", label: "쿠폰 사용 안 함" },
              {
                value: "welcome",
                label: benefits?.coupons[0]?.name ?? "시연 환영 쿠폰",
              },
            ]}
            placeholder="사용할 쿠폰 입력"
            value={coupon}
            disabled={pending}
            onValueChange={(value) => {
              const selected = value === "welcome" ? "welcome" : "none";
              setCoupon(selected);
              void apply({ coupon: selected });
            }}
          >
            <SelectItem value="none">쿠폰 사용 안 함</SelectItem>
            <SelectItem value="welcome">
              {benefits?.coupons[0]?.name ?? "시연 환영 쿠폰"}
            </SelectItem>
          </Select>
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
