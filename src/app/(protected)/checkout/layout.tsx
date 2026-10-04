"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { CartSessionSync } from "@/app/cart-session-sync";
import { isPurchasePreviewRoute } from "@/lib/purchase-preview-route";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isPurchasePreviewRoute(pathname)) return children;
  return <CartSessionSync>{children}</CartSessionSync>;
}
