import type { SVGProps } from "react";
const ArrowUpIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <path fill="#121B29" d="m8 3 5 5.155-.7.721L8 4.443 3.7 8.876 3 8.155z" />
    <path fill="#121B29" d="M7.5 3.722h1V13h-1z" />
  </svg>
);
export { ArrowUpIcon };
