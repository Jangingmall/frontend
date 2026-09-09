import type { SVGProps } from "react";
const CalendarIcon = (props: SVGProps<SVGSVGElement>) => (
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
      d="M13 13.1v.9H3v-.9zm.1-.1V4a.1.1 0 0 0-.1-.1H3a.1.1 0 0 0-.1.1v9a.1.1 0 0 0 .1.1v.9l-.103-.005a1 1 0 0 1-.892-.893L2 13V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v9a1 1 0 0 1-.898.995L13 14v-.9a.1.1 0 0 0 .1-.1"
    />
    <path
      fill="#121B29"
      d="M13.487 5.6v.9H2.513v-.9zM4.05 1.875h.9v2h-.9zM11.05 1.875h.9v2h-.9zM7.55 1.875h.9v2h-.9zM4.5 8h1v1h-1zM7.5 8h1v1h-1zM10.5 8h1v1h-1zM4.5 10.5h1v1h-1zM7.5 10.5h1v1h-1zM10.5 10.5h1v1h-1z"
    />
  </svg>
);
export { CalendarIcon };
