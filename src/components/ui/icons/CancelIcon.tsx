import type { SVGProps } from "react";
const CancelIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M12.604 4.104 8.707 8l3.896 3.896-.707.707L8 8.708l-3.896 3.896-.708-.707L7.293 8 3.396 4.104l.708-.708L8 7.293l3.896-3.897z"
    />
  </svg>
);
export { CancelIcon };
