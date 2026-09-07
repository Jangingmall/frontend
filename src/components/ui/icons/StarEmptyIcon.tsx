import type { SVGProps } from "react";
const StarEmptyIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M9.966 5.187 15 5.636 11.178 9.12l1.148 5.18L8 11.553l-4.326 2.748 1.148-5.18L1 5.636l5.034-.45L8 .302z"
      opacity={0.3}
    />
  </svg>
);
export { StarEmptyIcon };
