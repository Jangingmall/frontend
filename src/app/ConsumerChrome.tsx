"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
export function ConsumerChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return pathname === "/seller" || pathname.startsWith("/seller/")
    ? null
    : children;
}
