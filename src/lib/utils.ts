import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * globals.css `@theme` 에 등록한 커스텀 텍스트 스타일(font-size) 이름을 tailwind-merge 에
 * 알려준다. 이걸 안 하면 tailwind-merge 가 `text-body-m` 같은 클래스를 색상(`text-red-500`
 * 류)으로 오인해 `text-(--font-white)` 같은 색상 유틸리티와 같은 그룹으로 묶고 하나를
 * 지워버린다(= Button 라벨 색이 사라지는 버그).
 */
const FONT_SIZE_TOKENS = [
  "display-l",
  "display-m",
  "display-s",
  "title-xl",
  "title-l",
  "title-m",
  "title-s",
  "body-l",
  "body-m",
  "body-s-b",
  "body-s",
  "caption-b",
  "caption",
  "button-xl",
  "button-l",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: FONT_SIZE_TOKENS }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
