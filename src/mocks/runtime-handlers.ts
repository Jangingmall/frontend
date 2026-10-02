import { getResponse, http, passthrough } from "msw";

import { imageHandlers } from "@/api/images/mock/handlers";
import {
  memberMeUser,
  SEED_OAUTH_ACCESS_TOKEN,
} from "@/api/member/mock/fixtures";
import {
  setDynamicMember,
  setMockIdentity,
} from "@/api/member/mock/mock-identity";
import {
  type DataMode,
  isDemoFeatureRequest,
  shouldMockRequest,
} from "@/lib/data-mode";

import { mockError, mockOk } from "./envelope";
import { handlers } from "./handlers";

/** 시연 전용 주소는 원본 핸들러로 전달하되 실제 서버로 빠져나가지 않는다. */
export function createRuntimeHandlers(mode: DataMode) {
  return [
    ...(mode === "msw" ? [imageHandlers[1]] : []),
    http.all("*/api/*", async ({ request }) => {
      const url = new URL(request.url);
      if (!shouldMockRequest(mode, url.pathname)) return passthrough();
      if (mode === "api" && !isDemoFeatureRequest(url.pathname, request.method))
        return mockError(501, "MOCK_NOT_IMPLEMENTED");
      if (
        url.pathname === "/api/mock/member/oauth2/naver" &&
        request.method === "POST"
      ) {
        const member = { ...memberMeUser, authProvider: "NAVER" as const };
        setMockIdentity("USER");
        setDynamicMember(member);
        return mockOk({ accessToken: SEED_OAUTH_ACCESS_TOKEN, member });
      }
      url.pathname = url.pathname.replace(/^\/api\/mock\/session\//, "/api/");
      url.pathname = url.pathname.replace(/^\/api\/mock\/catalogue\//, "/api/");
      url.pathname = url.pathname.replace(
        /^\/api\/mock\/chatbot\//,
        "/api/chatbot/",
      );
      const headers = new Headers(request.headers);
      headers.delete("cookie");
      if (mode === "api") headers.delete("authorization");
      const response = await getResponse(
        handlers,
        new Request(url, {
          method: request.method,
          headers,
          body: ["GET", "HEAD"].includes(request.method)
            ? undefined
            : await request.clone().arrayBuffer(),
        }),
      );
      return response ?? mockError(501, "MOCK_NOT_IMPLEMENTED");
    }),
  ];
}
