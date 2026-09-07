import type { SVGProps } from "react";
const ArrowRightIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="m13 8-5.155 5-.721-.7L11.557 8 7.124 3.7l.721-.7z"
    />
    <path fill="#121B29" d="M12.278 7.5v1H3v-1z" />
  </svg>
);
export { ArrowRightIcon };
