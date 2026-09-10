import { useAuthStore } from "@/stores/auth";

import { ApiError } from "./api-error";
import { parseBody, resolveResponse, unwrapSuccess } from "./response";

/**
 * 클라이언트(브라우저) fetcher. (docs/data-layer.md §4.2 · docs/routing-and-auth.md §4)
 *
 * - 호출부가 `/api/member/me`처럼 전체 경로를 넘긴다. FE·BE가 same-origin(Vercel rewrite)이라
 *   현재 origin에 resolve하며 `NEXT_PUBLIC_API_BASE_URL`이 필요 없다.
 * - 인증 요청에 메모리의 access token을 `Authorization: Bearer`로 주입한다.
 * - 401을 받으면 single-flight refresh 후 원요청을 1회 재시도한다.
 *
 * 응답 봉투 해제·`ApiError` 규칙은 서버 fetcher와 `./response`를 공유한다.
 */

/** 상대 경로를 현재 origin 기준 절대 URL로. (Node fetch가 상대 URL을 거부한다) */
function toUrl(path: string): string {
  const origin =
    typeof window !== "undefined" ? window.location?.origin : undefined;
  return origin ? new URL(path, origin).toString() : path;
}

interface ClientFetchOptions extends Omit<RequestInit, "body"> {
  /** 객체면 `JSON.stringify` + `Content-Type: application/json` 자동. */
  body?: unknown;
  /** 기본 `true`. `false`면 Bearer 미주입 + 401 자동 refresh를 하지 않는다(public 요청). */
  auth?: boolean;
}

async function doFetch(
  path: string,
  { body, auth = true, headers, ...init }: ClientFetchOptions,
): Promise<Response> {
  const finalHeaders = new Headers({ Accept: "application/json", ...headers });

  let finalBody: BodyInit | undefined;
  if (body !== undefined) {
    if (typeof body === "string") {
      finalBody = body;
    } else {
      finalBody = JSON.stringify(body);
      finalHeaders.set("Content-Type", "application/json");
    }
  }

  if (auth) {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) finalHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  return fetch(toUrl(path), {
    ...init,
    headers: finalHeaders,
    body: finalBody,
  });
}

let refreshInFlight: Promise<string> | null = null;

/**
 * `POST /api/member/token/refresh` — HttpOnly refresh 쿠키로 새 access token을 받는다.
 * (docs/routing-and-auth.md §4.3)
 *
 * **single-flight**: 진행 중인 refresh가 있으면 그 Promise를 공유한다. 동시 다발 401도,
 * 401 재시도와 부팅 복원이 겹쳐도 refresh 요청은 1건이다. 401 자동 재시도 경로(`clientFetch`)와
 * `api/member`의 `refreshToken()`이 이 primitive를 공유해 fetch 구현을 한 곳에 둔다.
 *
 * raw `fetch`를 쓴다 — `clientFetch`를 거치면 refresh 응답의 401이 또 refresh를 부른다.
 *
 * 401 자동 재시도 경로는 이 primitive를 직접 호출하므로(`api/member`의 Zod를 안 거침)
 * 여기서 `accessToken`이 비어 있지 않은 문자열인지 확인한다 — 아니면 `clientFetch`의
 * catch가 세션을 정리한다. (docs/data-layer.md §4.3 — 인증 응답은 검증 실패 시 throw)
 */
export function refreshAccessToken(): Promise<string> {
  refreshInFlight ??= (async () => {
    const response = await fetch(toUrl("/api/member/token/refresh"), {
      method: "POST",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const body = await parseBody(response);
    if (!response.ok) throw new ApiError(response.status, body);
    const { accessToken } = unwrapSuccess<{ accessToken?: unknown }>(body);
    if (typeof accessToken !== "string" || accessToken.length === 0) {
      throw new ApiError(502, body);
    }
    return accessToken;
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/** 테스트 전용 — 모듈 스코프 single-flight 상태를 비운다. */
export function __resetRefreshState(): void {
  refreshInFlight = null;
}

export async function clientFetch<T>(
  path: string,
  options: ClientFetchOptions = {},
): Promise<T> {
  const response = await doFetch(path, options);

  // public 요청이거나 401이 아니면 그대로 처리한다.
  if (response.status !== 401 || options.auth === false) {
    return resolveResponse<T>(response);
  }

  // 401 → refresh(single-flight) 후 새 토큰으로 원요청 1회 재시도.
  try {
    const accessToken = await refreshAccessToken();
    useAuthStore.getState().setAccessToken(accessToken);
  } catch (error) {
    // refresh 실패 확정 → 세션 종료. 전역 처리(§6.3)·가드가 로그인 이동을 담당한다.
    useAuthStore.getState().clear();
    throw error instanceof ApiError ? error : new ApiError(401, null);
  }

  // 재시도 결과는 그대로 표면화한다(재-refresh 없음).
  const retried = await doFetch(path, options);
  return resolveResponse<T>(retried);
}
