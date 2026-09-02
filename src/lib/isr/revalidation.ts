import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const MAX_TIMESTAMP_AGE_SECONDS = 5 * 60;

const eventSchema = z.object({
  event: z.enum([
    "product.created",
    "product.updated",
    "product.statusChanged",
    "product.deleted",
    "product.contentPublished",
    "artisan.updated",
    "artisan.statusChanged",
  ]),
  eventId: z.string().min(1),
  occurredAt: z.string().datetime(),
  data: z.object({
    productId: z.number().int().positive().optional(),
    artisanId: z.number().int().positive().optional(),
  }),
});

type RevalidationEvent = z.infer<typeof eventSchema>;

type VerifyAndRevalidateOptions = {
  rawBody: string;
  timestamp: string | null;
  signature: string | null;
  secret: string;
  now?: number;
  revalidateTag: (tag: string, profile: "max") => unknown;
};

export class RevalidationRequestError extends Error {
  constructor(
    public readonly status: 400 | 401,
    message: string,
  ) {
    super(message);
    this.name = "RevalidationRequestError";
  }
}

function assertValidSignature({
  rawBody,
  timestamp,
  signature,
  secret,
  now = Date.now(),
}: Omit<VerifyAndRevalidateOptions, "revalidateTag">) {
  const timestampNumber = Number(timestamp);
  if (
    !Number.isInteger(timestampNumber) ||
    Math.abs(Math.floor(now / 1000) - timestampNumber) >
      MAX_TIMESTAMP_AGE_SECONDS
  ) {
    throw new RevalidationRequestError(401, "Invalid revalidation timestamp.");
  }
  if (!signature?.startsWith("sha256=")) {
    throw new RevalidationRequestError(401, "Invalid revalidation signature.");
  }

  const expected = `sha256=${createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex")}`;
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    throw new RevalidationRequestError(401, "Invalid revalidation signature.");
  }
}

function tagsFor(event: RevalidationEvent) {
  if (event.event === "product.created") return [];
  if (event.event.startsWith("product.")) {
    if (!event.data.productId) {
      throw new RevalidationRequestError(
        400,
        "Product events require data.productId.",
      );
    }
    return [`product:${event.data.productId}`, "products"];
  }
  if (!event.data.artisanId) {
    throw new RevalidationRequestError(
      400,
      "Artisan events require data.artisanId.",
    );
  }
  return event.event === "artisan.updated"
    ? [
        `artisan:${event.data.artisanId}`,
        "artisans",
        "product-artisan",
        "products",
      ]
    : [`artisan:${event.data.artisanId}`, "artisans", "product-artisan"];
}

export function verifyAndRevalidate({
  revalidateTag,
  ...options
}: VerifyAndRevalidateOptions) {
  assertValidSignature(options);
  let rawEvent: unknown;
  try {
    rawEvent = JSON.parse(options.rawBody);
  } catch {
    throw new RevalidationRequestError(400, "Invalid revalidation event.");
  }
  const parsed = eventSchema.safeParse(rawEvent);
  if (!parsed.success) {
    throw new RevalidationRequestError(400, "Invalid revalidation event.");
  }

  const tags = tagsFor(parsed.data);
  tags.forEach((tag) => revalidateTag(tag, "max"));
  return { eventId: parsed.data.eventId, tags };
}
