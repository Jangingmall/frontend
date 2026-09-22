import { ZodError } from "zod";

import { resolveErrorMessage } from "@/constants/error-messages";
import { ApiError } from "@/lib/http/api-error";
export function getPaymentErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (
      ["BUSINESS_RULE_VIOLATION", "CONFLICT"].includes(error.code ?? "") &&
      typeof error.body === "object" &&
      error.body !== null &&
      "message" in error.body &&
      typeof error.body.message === "string" &&
      error.body.message.trim()
    )
      return error.body.message;
    return resolveErrorMessage(error.code, error.status);
  }
  if (error instanceof ZodError)
    return "결제 응답 정보를 확인하지 못했습니다. 주문 내역을 확인하거나 다시 시도해 주세요.";
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof error.message === "string"
  )
    return error.message;
  return "결제 결과를 확인하지 못했습니다. 주문 내역을 확인하거나 다시 시도해 주세요.";
}
