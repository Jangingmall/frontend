"use client";

import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "product-information", label: "상품정보" },
  { id: "product-notices", label: "유의사항" },
  { id: "product-shipping", label: "배송안내" },
  { id: "product-reviews", label: "리뷰·문의" },
];

function subscribeToHash(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

function getActiveSection() {
  const id = window.location.hash.slice(1);
  return SECTIONS.some((section) => section.id === id)
    ? id
    : "product-information";
}

export function ProductSectionNav() {
  const activeSection = useSyncExternalStore(
    subscribeToHash,
    getActiveSection,
    () => "product-information",
  );
  return (
    <nav
      aria-label="상품 상세 메뉴"
      className="flex min-h-11 bg-fill-neutral text-font-white"
    >
      {SECTIONS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          aria-current={activeSection === id ? "location" : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-center justify-center px-2 py-3 text-body-m outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-white sm:min-w-18 sm:flex-none sm:px-6",
            activeSection === id && "bg-fill-neutral-impact font-bold",
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
