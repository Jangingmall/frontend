import type { SVGProps } from "react";
const LockIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M8.6 11.141A.95.95 0 0 0 8 9.45a.952.952 0 0 0-.6 1.691v1.112h1.2z"
      clipRule="evenodd"
    />
    <path
      fill="#121B29"
      fillRule="evenodd"
      d="M13.6 7.177h-2.05V3.031A1.55 1.55 0 0 0 10 1.481H6a1.55 1.55 0 0 0-1.55 1.55v4.146H2.4v7.2h11.2zm-1.1 1.101v5h-9v-5zm-2.05-5.247a.45.45 0 0 0-.45-.45H6a.45.45 0 0 0-.45.45v4.146h4.9z"
      clipRule="evenodd"
    />
  </svg>
);
export { LockIcon };
