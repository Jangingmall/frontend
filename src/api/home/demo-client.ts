import { fetchDemoProductList } from "@/api/products/demo-catalogue";
import { clientFetch } from "@/lib/http/client";
import type { GiftThemeId } from "@/types/gift-theme";

import { withHomeGiftImages } from "./demo-images";

export function fetchHomeDemoGiftsClient(
  theme: GiftThemeId,
  signal?: AbortSignal,
) {
  return fetchDemoProductList({ giftTheme: theme, size: 3 }, [], (path) =>
    clientFetch(path, { auth: false, signal }),
  ).then(withHomeGiftImages);
}
