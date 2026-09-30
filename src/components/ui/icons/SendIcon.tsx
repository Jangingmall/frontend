import type { SVGProps } from "react";
const SendIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      fill="var(--icon-black)"
      d="M13.629 2.375 9.957 14.414l-3.782-3.782L7.204 8.61 5.182 9.64 1.59 6.047zM5.357 8.54 9.26 6.554l-1.987 3.903 2.26 2.26 2.742-8.989-8.99 2.741z"
    />
  </svg>
);
export { SendIcon };
