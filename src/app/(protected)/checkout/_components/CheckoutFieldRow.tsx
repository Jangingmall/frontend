import type { ReactNode } from "react";
export function CheckoutFieldRow({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[90px_minmax(0,1fr)] items-start gap-6 max-sm:grid-cols-1 max-sm:gap-1">
      <div className="flex min-h-9 items-center text-body-s-b">
        {label}
        {required && (
          <span aria-hidden className="ml-1 text-red-font">
            *
          </span>
        )}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
