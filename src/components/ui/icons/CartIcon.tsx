import type { SVGProps } from "react";
const CartIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M2.047 5.928h3.386V2.051h5.133v3.061h-.9v-2.16H6.333v7.025h-.9V6.83H2.947l.003 3.127 1.12 3.06.011.033h7.837l.012-.033 1.122-3.069V6.829H7.203v-.9h6.75v4.177l-1.406 3.843H3.452l-1.405-3.843zm7.619 4.05h.9V7.643h-.9z"
      clipRule="evenodd"
    />
  </svg>
);
export { CartIcon };
