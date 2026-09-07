import type { SVGProps } from "react";
const CancelFilledIcon = (props: SVGProps<SVGSVGElement>) => (
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
      fillRule="evenodd"
      d="M8 14.22a6 6 0 1 0 0-12 6 6 0 0 0 0 12m3.02-8.313L8.707 8.22l2.313 2.313-.707.707L8 8.927 5.687 11.24l-.707-.707L7.293 8.22 4.98 5.907l.707-.707L8 7.513 10.313 5.2z"
      clipRule="evenodd"
      opacity={0.3}
    />
  </svg>
);
export { CancelFilledIcon };
