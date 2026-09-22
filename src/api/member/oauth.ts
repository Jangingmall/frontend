import { z } from "zod";

import { clientFetch } from "@/lib/http/client";

import { mapMemberProfile } from "./mapper";
import { memberProfileResponseDto } from "./validation";

const exchangeSchema = z.discriminatedUnion("onboardingRequired", [
  z.object({ onboardingRequired: z.literal(true), accessToken: z.null() }),
  z.object({
    onboardingRequired: z.literal(false),
    accessToken: z.string().min(1),
  }),
]);

/** 티켓은 HttpOnly 쿠키이며, 토큰은 저장소에 영속화하지 않는다. */
export async function exchangeOAuthTicket() {
  const result = exchangeSchema.parse(
    await clientFetch("/api/member/oauth2/exchange", {
      method: "POST",
      auth: false,
      credentials: "same-origin",
    }),
  );
  if (result.onboardingRequired) return { outcome: "needsProfile" } as const;
  const member = memberProfileResponseDto.parse(
    await clientFetch("/api/member/me", {
      auth: false,
      headers: { Authorization: `Bearer ${result.accessToken}` },
    }),
  );
  return {
    outcome: "authenticated",
    accessToken: result.accessToken,
    user: mapMemberProfile(member),
  } as const;
}
