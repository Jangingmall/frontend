import { ApiError } from "./api-error";

/**
 * 서버 fetcher(`fetcher.ts`)와 클라이언트 fetcher(`client.ts`)가 공유하는 응답 처리.
 * 봉투 해제 규칙과 `ApiError` throw 규칙을 한 곳에만 둬서 두 fetcher가 어긋나지 않게 한다.
 * (docs/data-layer.md §4.2)
 */

type ApiSuccess<T> = {
  success: true;
  status: number;
  data: T;
};

/**
 * JSON 응답만 파싱한다. 본문이 없거나·JSON이 아니거나·JSON이 손상됐으면 `undefined`.
 * 손상된 JSON에서 `SyntaxError`를 던지면 `resolveResponse`가 `response.status`를 잃으므로
 * (예: 본문이 잘린 500) 삼키고 `undefined`로 넘긴다 — 실패 응답은 원래 status의 `ApiError`,
 * 성공 응답은 `ApiError(502)`가 된다.
 */
export async function parseBody(response: Response): Promise<unknown> {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    return undefined;
  }
  const body = await response.text();
  if (!body) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return undefined;
  }
}

/** `{ success, status, data }` 봉투에서 `data`를 꺼낸다. 봉투 형태가 아니면 `ApiError(502)`. */
export function unwrapSuccess<T>(body: unknown): T {
  if (
    typeof body !== "object" ||
    body === null ||
    !("success" in body) ||
    body.success !== true ||
    !("data" in body)
  ) {
    throw new ApiError(502, body);
  }
  return (body as ApiSuccess<T>).data;
}

/**
 * fetch `Response` → 봉투 해제된 `data`.
 * `!response.ok` → `ApiError(status)`, 봉투 파손 → `ApiError(502)`.
 */
export async function resolveResponse<T>(response: Response): Promise<T> {
  const body = await parseBody(response);
  if (!response.ok) throw new ApiError(response.status, body);
  return unwrapSuccess<T>(body);
}
