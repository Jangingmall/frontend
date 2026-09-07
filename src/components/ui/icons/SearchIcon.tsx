import type { SVGProps } from "react";
const SearchIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      fill="#121B29"
      d="M10.209 7.297a3.4 3.4 0 1 0-6.8 0 3.4 3.4 0 0 0 6.8 0m1 0a4.38 4.38 0 0 1-.986 2.774l3.222 3.222-.353.354-.355.353-3.23-3.23a4.4 4.4 0 1 1 1.702-3.473"
    />
  </svg>
);
export { SearchIcon };
