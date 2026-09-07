import type { SVGProps } from "react";
const StarFilledIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <path
      fill="#FFC14C"
      d="M9.966 5.187 15 5.636 11.178 9.12l1.148 5.18L8 11.553l-4.326 2.748 1.148-5.18L1 5.636l5.034-.45L8 .302zM6.848 6.285l-3.102.277 2.362 2.152-.687 3.095L8 10.17l2.578 1.639-.539-2.435-.147-.66 2.361-2.152-3.101-.277L8 3.423z"
    />
    <path
      fill="#FFC14C"
      d="m10.578 11.809-.539-2.435-.147-.66 2.361-2.152-3.101-.277L8 3.423 6.848 6.285l-3.102.277 2.362 2.152-.687 3.095L8 10.17z"
    />
  </svg>
);
export { StarFilledIcon };
