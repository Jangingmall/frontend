import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { mapProductListPage } from "@/api/products/mapper";
import { productCatalogue } from "@/api/products/mock/catalogue";

import { GiftSection } from "./GiftSection";

const initialData = mapProductListPage(
  { items: productCatalogue.slice(0, 3), totalCount: 3 },
  { page: 1, size: 3 },
);

/**
 * `GiftSection`은 실제 API를 호출한다(테마 토글 클릭마다 재조회). Storybook엔 MSW가
 * 붙어있지 않아 `initialData`로 첫 화면만 보장한다 — 테마를 바꿔보면 이 프리뷰 환경에선
 * 백엔드가 없어 "추천 상품을 불러오지 못했어요."로 떨어지는 게 정상이다.
 */
function withQueryClient(Story: () => React.JSX.Element) {
  const client = new QueryClient();
  return (
    <QueryClientProvider client={client}>
      <Story />
    </QueryClientProvider>
  );
}

const meta = {
  title: "Home/GiftSection",
  component: GiftSection,
  parameters: { layout: "fullscreen" },
  decorators: [withQueryClient],
  args: { initialTheme: "housewarming", initialData },
} satisfies Meta<typeof GiftSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
