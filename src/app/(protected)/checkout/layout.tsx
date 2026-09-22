import type { ReactNode } from "react";

import { CartSessionSync } from "@/app/cart-session-sync";

export default function CheckoutLayout({ children }: { children: ReactNode }) {
  return <CartSessionSync>{children}</CartSessionSync>;
}
