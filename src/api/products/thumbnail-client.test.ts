import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";

import { server } from "@/mocks/server";

import { fetchProductThumbnail } from "./thumbnail-client";

it.each([
  [{ thumbnailUrl: "/legacy.jpg" }, "/legacy.jpg"],
  [
    {
      thumbnail: [{ url: "/600.jpg", width: 600, height: 400, format: "jpeg" }],
      thumbnailUrl: "/legacy.jpg",
    },
    "/600.jpg",
  ],
  [
    {
      images: [
        {
          imageId: "1",
          variants: [
            { url: "/gallery.webp", width: 640, height: 640, format: "webp" },
          ],
        },
      ],
    },
    "/gallery.webp",
  ],
  [{}, null],
])("reads available product image fields: %j", async (fields, expected) => {
  server.use(
    http.get("*/api/products/5", () =>
      HttpResponse.json({ success: true, data: { productId: 5, ...fields } }),
    ),
  );
  expect(await fetchProductThumbnail(5)).toBe(expected);
});
it("does not use a different product's image", async () => {
  server.use(
    http.get("*/api/products/5", () =>
      HttpResponse.json({
        success: true,
        data: { productId: 6, thumbnailUrl: "/wrong.jpg" },
      }),
    ),
  );
  expect(await fetchProductThumbnail(5)).toBeNull();
});
