import type { GiftThemeId } from "@/types/gift-theme";

export const homeKeys = {
  gifts: (theme: GiftThemeId) => ["home", "demo-gifts", theme] as const,
};
