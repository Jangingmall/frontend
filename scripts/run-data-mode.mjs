import { spawn } from "node:child_process";

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd(), true);
const [mode, ...args] = process.argv.slice(2);
if (!["msw", "api"].includes(mode)) throw new Error("Use msw or api");
if (mode === "api" && !process.env.API_BASE_URL)
  throw new Error("API_BASE_URL에 실제 백엔드 주소를 지정해 주세요.");
if (mode === "api") {
  const backend = new URL(process.env.API_BASE_URL);
  const portIndex = args.findIndex((arg) => arg === "--port" || arg === "-p");
  const frontendPort = portIndex >= 0 ? args[portIndex + 1] : "3000";
  if (
    ["localhost", "127.0.0.1"].includes(backend.hostname) &&
    backend.port === frontendPort
  )
    throw new Error(
      "API_BASE_URL은 프론트엔드 자신이 아닌 백엔드 주소여야 합니다.",
    );
}
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", ...args],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      NEXT_PUBLIC_DATA_MODE: mode,
      NEXT_PUBLIC_API_MOCKING: "",
      API_BASE_URL:
        mode === "msw" ? "http://localhost:3000" : process.env.API_BASE_URL,
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
