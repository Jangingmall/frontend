import type { SVGProps } from "react";
const PlusIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <path fill="#121B29" d="M8.5 13h-1V3h1z" />
    <path fill="#121B29" d="M3 8.5v-1h10v1z" />
  </svg>
);
export { PlusIcon };
