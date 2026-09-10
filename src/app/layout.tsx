import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AuthBootstrap } from "./auth-bootstrap";
import { pretendard } from "./fonts";
import { QueryProvider } from "./query-provider";

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
          <AuthBootstrap>{children}</AuthBootstrap>
        </QueryProvider>
      </body>
    </html>
  );
}
