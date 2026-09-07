import type { SVGProps } from "react";
const ArrowLeftIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <path fill="#121B29" d="m3 8 5.155-5 .721.7L4.443 8l4.433 4.3-.721.7z" />
    <path fill="#121B29" d="M3.722 8.5v-1H13v1z" />
  </svg>
);
export { ArrowLeftIcon };
