import type { SVGProps } from "react";
const ChevronUpIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <path fill="#121B29" d="m8.15 5.15 5 5-.7.7-4.3-4.3-4.3 4.3-.7-.7z" />
  </svg>
);
export { ChevronUpIcon };
