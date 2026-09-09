import type { Preview } from "@storybook/nextjs-vite";
import { pretendard } from "../src/app/fonts";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
  },
  decorators: [
    // layout.tsx 가 렌더되지 않는 Storybook 에서도 Pretendard 를 적용한다. `.variable` 은
    // `--font-pretendard` 커스텀 속성만 정의하므로, 같은 요소에 `font-sans`(= font-family:
    // var(--font-sans) = var(--font-pretendard)) 도 함께 걸어야 실제로 적용된다.
    (Story) => (
      <div className={`${pretendard.variable} font-sans`}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
