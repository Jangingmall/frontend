import { publicEnv } from "@/lib/env";

/** Stage 인증 쿠키는 백엔드 호스트에 저장되므로 인증 요청도 같은 호스트로 보낸다. */
export function clientRequestTarget(path: string) {
  if (!/^\/api(?=[/?#]|$)/.test(path)) {
    throw new Error(
      `clientFetch는 same-origin 형식의 '/api' 상대 경로만 허용합니다: ${path}`,
    );
  }
  const origin =
    typeof window !== "undefined" ? window.location?.origin : undefined;
  const isStageMember =
    !publicEnv.apiMocking &&
    origin === "https://stg.midam.store" &&
    /^\/api\/member(?:\/|$)/.test(path);
  return {
    url: origin
      ? new URL(
          path,
          isStageMember ? "https://api.stg.midam.store" : origin,
        ).toString()
      : path,
    credentials: isStageMember ? ("include" as const) : undefined,
  };
}
