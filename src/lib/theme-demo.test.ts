import { afterEach, describe, expect, it, vi } from "vitest";

import { applyTheme, subscribeSystemTheme, themeInitScript } from "./theme";

afterEach(() => {
  window.history.replaceState(null, "", "/");
  localStorage.clear();
  document.documentElement.classList.remove("dark");
  vi.unstubAllGlobals();
});

describe("seller demo light theme", () => {
  it.each(["1", "2"])(
    "scenario %s stays light through boot and system updates",
    (id) => {
      let listener = () => {};
      vi.stubGlobal("matchMedia", () => ({
        matches: true,
        addEventListener: (_: string, callback: () => void) => {
          listener = callback;
        },
        removeEventListener: () => {},
      }));
      window.history.replaceState(null, "", `/seller/products/new/${id}`);
      localStorage.setItem("theme", "dark");
      new Function(themeInitScript)();
      expect(document.documentElement).not.toHaveClass("dark");
      applyTheme(true);
      expect(document.documentElement).not.toHaveClass("dark");
      applyTheme(null);
      const unsubscribe = subscribeSystemTheme();
      listener();
      expect(document.documentElement).not.toHaveClass("dark");
      unsubscribe();
      window.history.replaceState(null, "", "/seller/products");
      applyTheme(null);
      expect(document.documentElement).toHaveClass("dark");
    },
  );
});
