"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "product-information", label: "상품정보" },
  { id: "product-notices", label: "유의사항" },
  { id: "product-shipping", label: "배송안내" },
  { id: "product-reviews", label: "리뷰·문의" },
];

function getActiveSection(view: Window | null) {
  const id = view?.location.hash.slice(1);
  return SECTIONS.some((section) => section.id === id)
    ? id
    : "product-information";
}

export function ProductSectionNav() {
  const navigation = useRef<HTMLElement>(null);
  const subscribeToHash = useCallback((onChange: () => void) => {
    const view = navigation.current?.ownerDocument.defaultView ?? window;
    view.addEventListener("hashchange", onChange);
    return () => view.removeEventListener("hashchange", onChange);
  }, []);
  const activeSection = useSyncExternalStore(
    subscribeToHash,
    () =>
      getActiveSection(navigation.current?.ownerDocument.defaultView ?? window),
    () => "product-information",
  );
  return (
    <nav
      ref={navigation}
      aria-label="상품 상세 메뉴"
      className="-mx-6 flex min-h-11 bg-(--nav-menu-fill) text-font-white md:mx-0"
    >
      {SECTIONS.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={(event) => {
            const owner = event.currentTarget.ownerDocument;
            const view = owner.defaultView;
            if (view && view !== window) {
              event.preventDefault();
              view.location.hash = id;
              owner.getElementById(id)?.scrollIntoView({ block: "start" });
            }
          }}
          aria-current={activeSection === id ? "location" : undefined}
          className={cn(
            "flex min-w-0 flex-1 items-center justify-center px-2 py-3 text-body-m outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-white md:flex-initial md:px-6",
            activeSection === id && "bg-fill-neutral-impact font-bold",
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
