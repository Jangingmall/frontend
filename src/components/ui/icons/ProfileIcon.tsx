import type { SVGProps } from "react";
const ProfileIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="m10.249 8.5.133.1 2.917 2.173.201.15V14h-1v-2.576L9.917 9.5H5.979L3.5 11.418V14h-1v-3.072l.194-.15 2.807-2.173.135-.105zm-.45-3.305a1.8 1.8 0 1 0-3.599 0 1.8 1.8 0 0 0 3.6 0m1 0a2.8 2.8 0 1 1-5.599 0 2.8 2.8 0 0 1 5.6 0"
    />
  </svg>
);
export { ProfileIcon };
