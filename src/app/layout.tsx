import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Footer } from "@/components/common/footer";

import { AuthBootstrap } from "./auth-bootstrap";
import { ConsumerChrome } from "./ConsumerChrome";
import { pretendard } from "./fonts";
import { MockIdentitySwitcher } from "./mock-identity-switcher-loader";
import { QueryProvider } from "./query-provider";
import { SiteGnb } from "./site-gnb";

export const metadata: Metadata = {
  title: "장인몰",
  description: "장인몰 프론트엔드",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko" className={`${pretendard.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <QueryProvider>
          <AuthBootstrap>
            <ConsumerChrome>
              <SiteGnb />
            </ConsumerChrome>
            <main className="flex flex-1 flex-col">{children}</main>
            <ConsumerChrome>
              <Footer />
            </ConsumerChrome>
            <ConsumerChrome>
              <MockIdentitySwitcher />
            </ConsumerChrome>
          </AuthBootstrap>
        </QueryProvider>
      </body>
    </html>
  );
}
