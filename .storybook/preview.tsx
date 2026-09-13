import "../src/app/globals.css";

import type { Preview } from "@storybook/nextjs-vite";

import { pretendard } from "../src/app/fonts";

const preview: Preview = {
  parameters: {
    controls: { expanded: true },
    // App Router 전용 프로젝트 — 이게 없으면 `@storybook/nextjs-vite`가 기본으로 Pages Router
    // 목만 세팅해서(`next/router`), `next/navigation`의 `useRouter()`(App Router)를 쓰는
    // 컴포넌트(`SearchPanel` 등)가 "invariant expected app router to be mounted"로 죽는다.
    nextjs: { appDirectory: true },
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
