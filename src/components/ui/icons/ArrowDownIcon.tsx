import type { SVGProps } from "react";
const ArrowDownIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <path fill="#121B29" d="M8 13 3 7.845l.7-.721L8 11.557l4.3-4.433.7.721z" />
    <path fill="#121B29" d="M8.5 12.278h-1V3h1z" />
  </svg>
);
export { ArrowDownIcon };
