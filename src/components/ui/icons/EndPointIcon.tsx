import type { SVGProps } from "react";
const EndPointIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="m9.2 8-5 5-.7-.7L7.8 8 3.5 3.7l.7-.7zM11 3h1v10h-1z"
    />
  </svg>
);
export { EndPointIcon };
