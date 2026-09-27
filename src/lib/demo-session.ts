import { useSyncExternalStore } from "react";

import { publicEnv } from "./env";
const key = "midam:api-demo-session";
export function isDemoSession() {
  return (
    typeof window !== "undefined" && window.sessionStorage.getItem(key) === "1"
  );
}
export function setDemoSession(enabled: boolean) {
  if (typeof window === "undefined") return;
  if (enabled) sessionStorage.setItem(key, "1");
  else sessionStorage.removeItem(key);
  window.dispatchEvent(new Event("midam-demo-session"));
}
export function usesMockAccount() {
  return publicEnv.apiMocking || isDemoSession();
}
export function privateRequestPath(path: string, auth: boolean, demo: boolean) {
  if (
    !demo ||
    path.startsWith("/api/mock/") ||
    (!auth && !path.startsWith("/api/member/"))
  )
    return path;
  return path.replace(/^\/api\//, "/api/mock/session/");
}

const subscribe = (notify: () => void) => {
  window.addEventListener("midam-demo-session", notify);
  return () => window.removeEventListener("midam-demo-session", notify);
};
/** SSR and the first hydration render must use the same snapshot. */
export function useDemoSession() {
  return useSyncExternalStore(subscribe, isDemoSession, () => false);
}
export function useMockAccount() {
  const demo = useDemoSession();
  return publicEnv.apiMocking || demo;
}
