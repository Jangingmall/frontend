import type { SVGProps } from "react";
const MenuIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <path fill="#121B29" d="M13 11.5v1H3v-1zm0-4v1H3v-1zm0-4v1H3v-1z" />
  </svg>
);
export { MenuIcon };
