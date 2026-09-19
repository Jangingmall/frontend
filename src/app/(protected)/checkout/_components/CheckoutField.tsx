"use client";
import { useController } from "react-hook-form";

import type { CheckoutFormValues } from "@/app/(protected)/checkout/_lib/checkout-form-schema";
import { InputField } from "@/components/ui/input-field";
interface CheckoutFieldProps {
  name: keyof CheckoutFormValues;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "tel";
  readOnly?: boolean;
}
export function CheckoutField({
  name,
  label,
  placeholder,
  type = "text",
  readOnly,
}: CheckoutFieldProps) {
  const { field, fieldState } = useController<CheckoutFormValues>({ name });
  return (
    <InputField
      {...field}
      aria-label={label}
      placeholder={placeholder}
      type={type}
      readOnly={readOnly}
      clearable={!readOnly}
      className="h-9"
      error={fieldState.error?.message}
    />
  );
}
