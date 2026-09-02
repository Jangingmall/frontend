import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import {
  RevalidationRequestError,
  verifyAndRevalidate,
} from "@/lib/isr/revalidation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Webhook secret is not configured." },
      { status: 500 },
    );
  }

  try {
    const result = verifyAndRevalidate({
      rawBody: await request.text(),
      timestamp: request.headers.get("x-revalidate-timestamp"),
      signature: request.headers.get("x-revalidate-signature"),
      secret,
      revalidateTag,
    });
    console.info("ISR revalidation completed", {
      event: result.eventId,
      tags: result.tags,
    });
    return NextResponse.json({ revalidated: true, ...result });
  } catch (error) {
    if (error instanceof RevalidationRequestError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("ISR revalidation failed", { error: "unexpected" });
    return NextResponse.json(
      { error: "Unable to revalidate." },
      { status: 500 },
    );
  }
}
