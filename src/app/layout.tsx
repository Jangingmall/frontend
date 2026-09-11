import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Footer } from "@/components/common/footer";

import { AuthBootstrap } from "./auth-bootstrap";
import { pretendard } from "./fonts";
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
            <SiteGnb />
            <main className="flex-1">{children}</main>
            <Footer />
          </AuthBootstrap>
        </QueryProvider>
      </body>
    </html>
  );
}
