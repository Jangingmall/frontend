import type { SVGProps } from "react";
const TopIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={16}
    height={16}
    fill="none"
    viewBox="0 0 16 16"
    {...props}
  >
    <path fill="#121B29" d="m8 4 5 5.155-.7.721L8 5.443 3.7 9.876 3 9.155z" />
    <path fill="#121B29" d="M7.5 4.722h1V14h-1zM13 2v1H3V2z" />
  </svg>
);
export { TopIcon };
