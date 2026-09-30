import type { SVGProps } from "react";
const RefreshIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      fill="var(--icon-black)"
      d="M3.638 4.002a5.952 5.952 0 0 1 10.108 5.592A5.95 5.95 0 0 1 2.05 8.052v-.45h.9v.449a5.051 5.051 0 0 0 7.854 4.199A5.051 5.051 0 1 0 4.092 4.85h1.846v.9h-3.2v-3.65h.9z"
    />
  </svg>
);
export { RefreshIcon };
