import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only`는 클라이언트 import를 막으려 로드 즉시 throw한다. Vitest는
      // `react-server` 조건을 안 켜므로 그 throw를 그대로 맞는다 → 빈 모듈로 대체.
      "server-only": fileURLToPath(
        new URL("./node_modules/server-only/empty.js", import.meta.url),
      ),
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["src/e2e/**", "node_modules/**", ".next/**"],
    pool: "forks",
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    // 서버 fetcher는 절대 URL을 요구한다(`serverEnv.apiBaseUrl`). MSW 경유 테스트용 더미.
    env: { API_BASE_URL: "http://localhost:3000" },
  },
});
import { fileURLToPath } from "node:url";
