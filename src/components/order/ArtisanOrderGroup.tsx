import type { ReactNode } from "react";

import { ChevronRightIcon } from "@/components/ui/icons";
export interface ArtisanOrderGroupProps {
  artisanName: string;
  children: ReactNode;
  headerAction?: ReactNode;
  onArtisanClick?: () => void;
}
export function ArtisanOrderGroup({
  artisanName,
  children,
  headerAction,
  onArtisanClick,
}: ArtisanOrderGroupProps) {
  return (
    <section className="overflow-hidden rounded-xs bg-bg-default shadow-floating">
      <header className="flex min-h-11 items-center gap-3 bg-fill-neutral-weak px-4 py-3">
        {headerAction}
        {onArtisanClick ? (
          <button
            type="button"
            onClick={onArtisanClick}
            className="flex items-center text-body-m font-bold"
          >
            {artisanName}
            <ChevronRightIcon className="size-4" />
          </button>
        ) : (
          <span className="text-body-m font-bold">{artisanName}</span>
        )}
      </header>
      <div className="px-4">{children}</div>
    </section>
  );
}
