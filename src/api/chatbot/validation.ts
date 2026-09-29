import { z } from "zod";

const positiveId = z.number().int().positive().safe();

/** `POST /api/chatbot/sessions` 응답. */
export const chatSessionDto = z
  .object({
    sessionId: z.string(),
    expiresInSeconds: z.number().int().positive(),
  })
  .passthrough();

/** BE `ChatSender` — `USER`/`ADMIN` 두 값뿐이다(봇 메시지가 `ADMIN`으로 온다). */
const chatSenderDto = z.enum(["USER", "ADMIN"]);

const thumbnailVariantDto = z
  .object({
    url: z.string(),
    width: z.number(),
    height: z.number(),
    format: z.string(),
  })
  .passthrough();

/** BE `ChatResponse.ProductCard` — `products[]`가 실제 소비하는 슬라이스만 선언. */
const chatProductCardDto = z
  .object({
    productId: positiveId,
    name: z.string(),
    price: z.number().int().nonnegative(),
    thumbnail: z.array(thumbnailVariantDto),
    status: z.string(),
    category: z.string().nullable(),
    rating: z.number().nullable(),
    primaryBadge: z.string().nullable(),
    artisanId: positiveId,
    artisanName: z.string(),
    reason: z.string(),
  })
  .passthrough();

export type ChatProductCardDto = z.infer<typeof chatProductCardDto>;

/** `POST /api/chatbot/sessions/{sessionId}/messages` 응답. */
export const chatSendResultDto = z
  .object({
    sessionId: z.string(),
    messageId: positiveId,
    reply: z.string(),
    intent: z.string().nullable(),
    suggestions: z.array(z.string()),
    products: z.array(chatProductCardDto),
  })
  .passthrough();

export type ChatSendResultDto = z.infer<typeof chatSendResultDto>;

/** `GET /api/chatbot/sessions/{sessionId}/messages` 응답 item. `products`/`suggestions` 없음. */
export const chatMessageDto = z
  .object({
    messageId: positiveId,
    sessionId: z.string(),
    sender: chatSenderDto,
    content: z.string(),
    sentAt: z.string(),
  })
  .passthrough();

export type ChatMessageDto = z.infer<typeof chatMessageDto>;

export const chatHistoryDto = z.array(chatMessageDto);
