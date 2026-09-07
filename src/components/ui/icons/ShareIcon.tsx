import type { SVGProps } from "react";
const ShareIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M12.364 3.8a.9.9 0 0 0-1.8 0v.9h.9v.9h-1.8V3.8a1.8 1.8 0 1 1 1.8 1.8v-.9a.9.9 0 0 0 .9-.9M12.364 12.2a.9.9 0 0 1-1.8 0v-.9h.9v-.9h-1.8v1.8a1.8 1.8 0 1 0 1.8-1.8v.9a.9.9 0 0 1 .9.9M5.282 10.545 7.827 8 5.282 5.455 2.736 8zm0-3.818L6.555 8 5.282 9.273 4.01 8z"
    />
    <path
      fill="#121B29"
      d="M10.618 5.354 7.97 8l2.647 2.646-.707.707L6.557 8l3.354-3.354z"
    />
  </svg>
);
export { ShareIcon };
