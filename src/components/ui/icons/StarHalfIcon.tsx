import type { SVGProps } from "react";
const StarHalfIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M8 3.423V.301l1.966 4.886L15 5.636 11.178 9.12l1.148 5.18L8 11.553v-8.13"
      opacity={0.3}
    />
    <path
      fill="#FFC14C"
      fillRule="evenodd"
      d="M8 .301v11.252l-4.326 2.748 1.148-5.18L1 5.636l5.034-.45z"
      clipRule="evenodd"
    />
  </svg>
);
export { StarHalfIcon };
