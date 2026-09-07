import type { SVGProps } from "react";
const HeartFilledIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      fill="#E84610"
      d="m13.797 4.805.203.149v3.258l-.163.15L8 13.684 2.163 8.362 2 8.211V4.955l.203-.15L5.518 2.36 8 4.365l2.482-2.006zM8 5.65 5.49 3.622 3 5.459V7.77l5 4.562 5-4.562V5.46l-2.49-1.837z"
    />
    <path
      fill="#ED6B40"
      fillRule="evenodd"
      d="M5.49 3.622 8 5.652l2.51-2.03L13 5.459V7.77l-5 4.562L3 7.77V5.46z"
      clipRule="evenodd"
    />
  </svg>
);
export { HeartFilledIcon };
