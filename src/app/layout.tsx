import type { Metadata } from "next";
import type { ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { pretendard } from "./fonts";
import "./globals.css";

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
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
