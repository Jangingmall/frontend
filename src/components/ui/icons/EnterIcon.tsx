import type { SVGProps } from "react";
const EnterIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M12.45 3v8.45H4.087l1.231 1.232-.636.636L2.363 11l2.319-2.318.636.636-1.231 1.232h7.463V3z"
    />
  </svg>
);
export { EnterIcon };
