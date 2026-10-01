import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { type DefaultBodyType, delay, http, HttpResponse } from "msw";
import { beforeEach, expect, it, vi } from "vitest";

import { uploadPublicImage } from "@/api/images/api";
import {
  createSellerStudioApi,
  type SellerContent,
} from "@/api/seller-studio/api";
import { mockError, mockOk } from "@/mocks/envelope";
import { server } from "@/mocks/server";
import { sellerKeys, useSellerContent } from "@/queries/seller-studio/queries";
import {
  type SellerStudioRuntime,
  SellerStudioRuntimeContext,
} from "@/queries/seller-studio/runtime";
import { useAuthStore } from "@/stores/auth";
import {
  editNode,
  type NodePatch,
  type StudioDocument,
} from "@/utils/seller-studio/document";

import {
  readServerDocumentSnapshot,
  writeServerDocumentSnapshot,
} from "./document-editor-storage";
import { ServerStudioEditor } from "./ServerStudioEditor";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/seller/products/new",
  useSearchParams: () => new URLSearchParams(),
}));

// jsdom에는 이미지 디코더와 canvas가 없으므로 codec만 대체한다. API와 UI는 실제 구현이다.
vi.mock("browser-image-compression", () => ({
  default: async (file: File) =>
    new File([file], file.name, { type: "image/webp" }),
}));
vi.mock("@/utils/image", () => ({
  readImageDimensions: async () => ({ width: 640, height: 480 }),
}));
const identity = { ownerId: 7, productId: 12, contentId: 18, version: 3 };
const document: StudioDocument = {
  schemaVersion: "2.0",
  canvasWidth: 774,
  root: [
    {
      id: "first",
      type: "element",
      tag: "section",
      children: [
        {
          id: "paragraph",
          type: "element",
          tag: "p",
          children: [{ id: "text", type: "text", value: "원본 문구" }],
        },
        {
          id: "photo",
          type: "element",
          tag: "img",
          props: {
            imageId: "original-photo",
            src: "/seller-demos/1/hero.webp",
            alt: "원본 사진",
          },
        },
      ],
    },
    {
      id: "second",
      type: "element",
      tag: "section",
      children: [
        {
          id: "second-paragraph",
          type: "element",
          tag: "p",
          children: [{ id: "second-text", type: "text", value: "둘째 문구" }],
        },
      ],
    },
  ],
};
let savedDocument: StudioDocument;
let version: number;
let requests: NodePatch[][];
let failSave: boolean;
let failUpload: boolean;
let uploadDelay: number;
let uploadedVariants: string[];
const content = (status: SellerContent["status"] = "DRAFT"): SellerContent => ({
  productId: 12,
  contentId: 18,
  version,
  status,
  reactDocument: structuredClone(savedDocument),
});
beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({
    user: { id: 7, name: "판매자", role: "ARTISAN" },
    status: "authenticated",
    accessToken: null,
  });
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    top: 200,
    bottom: 240,
    left: 300,
    right: 800,
    width: 500,
    height: 40,
    x: 300,
    y: 200,
    toJSON: () => ({}),
  });
  savedDocument = structuredClone(document);
  version = 3;
  requests = [];
  failSave = false;
  failUpload = false;
  uploadDelay = 0;
  uploadedVariants = [];
  server.use(
    http.patch(
      "*/api/content/products/12/contents/18",
      async ({ request }): Promise<HttpResponse<DefaultBodyType>> => {
        const { patches } = (await request.json()) as { patches: NodePatch[] };
        requests.push(patches);
        if (failSave) return mockError(503, "UNAVAILABLE", "저장 서버 오류");
        for (const { nodeId, ...patch } of patches)
          savedDocument = editNode(savedDocument, nodeId, patch);
        return mockOk({
          productId: 12,
          contentId: 18,
          status: "DRAFT",
          version: ++version,
        });
      },
    ),
    http.get("*/api/products/12", () =>
      mockOk({
        productId: 12,
        title: "판매 작품",
        price: 15000,
        stock: 4,
        status: "DRAFT",
      }),
    ),
    http.post("*/api/images/presigned-url", async ({ request }) => {
      const body = (await request.json()) as {
        purpose: string;
        variants: { name: string }[];
      };
      expect(body.purpose).toBe("CONTENT");
      expect(body.variants.map((item) => item.name)).toEqual([
        "320w",
        "640w",
        "1280w",
      ]);
      return mockOk({
        imageId: "uploaded-photo",
        expiresInSeconds: 300,
        uploads: body.variants.map(({ name }) => ({
          variant: name,
          objectKey: `uploaded-photo/${name}`,
          presignedUrl: `https://uploads.test/${name}`,
        })),
      });
    }),
    http.put("https://uploads.test/:variant", async ({ params }) => {
      if (uploadDelay) await delay(uploadDelay);
      if (failUpload) return new HttpResponse(null, { status: 503 });
      uploadedVariants.push(String(params.variant));
      return new HttpResponse(null, { status: 200 });
    }),
  );
});
function CachedEditor() {
  const query = useSellerContent(12, true, 7);
  return query.data ? <ServerStudioEditor content={query.data} /> : null;
}
async function setup(
  value = content(),
  options: { client?: QueryClient; cached?: boolean; scope?: string } = {},
) {
  let guard: (() => boolean) | null = null;
  const runtime: SellerStudioRuntime = {
    api: createSellerStudioApi(),
    scope: options.scope,
    uploadImage: uploadPublicImage,
    studioUrl: () => "/seller/products/new?productId=12",
    setNavigationGuard: (next) => {
      guard = next;
    },
    canNavigate: () => guard?.() ?? true,
  };
  const view = render(
    <QueryClientProvider
      client={
        options.client ??
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <SellerStudioRuntimeContext value={runtime}>
        {options.cached ? (
          <CachedEditor />
        ) : (
          <ServerStudioEditor content={value} />
        )}
      </SellerStudioRuntimeContext>
    </QueryClientProvider>,
  );
  await screen.findByRole("button", { name: "미리보기" });
  fireEvent.click(screen.getByRole("button", { name: "도움말 닫기" }));
  return { ...view, runtime };
}
function editText(value: string) {
  const node = screen.getAllByRole("textbox", { name: "텍스트 편집" })[0];
  node.textContent = value;
  fireEvent.blur(node);
}
async function save() {
  fireEvent.click(screen.getByRole("button", { name: "임시 저장" }));
  await screen.findByText("임시 저장되었습니다");
}

it("실제 공통 UI의 문구 변경은 PATCH되고 전체 문서는 응답 버전으로 저장된다", async () => {
  await setup();
  editText("서버에 저장할 문구");
  await save();
  expect(requests).toEqual([[{ nodeId: "text", text: "서버에 저장할 문구" }]]);
  expect(
    readServerDocumentSnapshot({ ...identity, version: 4 })?.document.root[0]
      .children?.[0].children?.[0].value,
  ).toBe("서버에 저장할 문구");
});

it.each([undefined, "isolated-api-runtime"])(
  "%s 콘텐츠 캐시로 재진입해도 저장한 문구와 로컬 페이지를 복원한다",
  async (scope) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    const key = [...sellerKeys.all, scope ?? 7, "content", 12];
    client.setQueryData(key, content("REJECTED"));
    const first = await setup(undefined, { client, cached: true, scope });
    editText("재진입해도 유지할 문구");
    fireEvent.click(screen.getByRole("button", { name: "페이지 1 편집" }));
    fireEvent.click(screen.getByRole("button", { name: "페이지 추가" }));
    fireEvent.click(screen.getByRole("button", { name: "새 영역 추가" }));
    await save();
    expect(
      readServerDocumentSnapshot({ ...identity, version: 4 })?.document.root,
    ).toHaveLength(3);
    first.unmount();

    await setup(undefined, { client, cached: true, scope });
    expect(
      screen.getAllByRole("button", { name: /^페이지 \d 편집$/ }),
    ).toHaveLength(3);
    expect(screen.getByText("재진입해도 유지할 문구")).toBeVisible();
    const cached = client.getQueryData<SellerContent>(key);
    expect(cached).toMatchObject({ version: 4, status: "DRAFT" });
    expect(cached?.reactDocument).toEqual(savedDocument);
    expect(cached?.reactDocument.root).toHaveLength(2);
  },
);

it("PATCH 실패는 문구와 재시도 상태를 유지한다", async () => {
  await setup();
  failSave = true;
  editText("실패 후 유지");
  fireEvent.click(screen.getByRole("button", { name: "임시 저장" }));
  await screen.findByRole("alert");
  expect(screen.getByText("실패 후 유지")).toBeVisible();
  expect(screen.queryByText("임시 저장되었습니다")).not.toBeInTheDocument();
  failSave = false;
  await save();
  expect(requests).toHaveLength(2);
});

it("페이지 추가는 서버 PATCH 없이 브라우저에 보존되고 두 번째 저장에도 로컬 노드를 전송하지 않는다", async () => {
  const view = await setup();
  fireEvent.click(screen.getByRole("button", { name: "페이지 1 편집" }));
  fireEvent.click(screen.getByRole("button", { name: "페이지 추가" }));
  fireEvent.click(screen.getByRole("button", { name: "새 영역 추가" }));
  await save();
  expect(requests).toEqual([]);
  expect(readServerDocumentSnapshot(identity)?.document.root).toHaveLength(3);
  view.unmount();
  await setup();
  expect(
    screen.getAllByRole("button", { name: /^페이지 \d 편집$/ }),
  ).toHaveLength(3);
  editText("기존 노드만 서버 저장");
  await save();
  expect(requests).toEqual([
    [{ nodeId: "text", text: "기존 노드만 서버 저장" }],
  ]);
});

it("다른 계정과 변경된 서버 버전의 저장본은 화면에 복원하지 않는다", async () => {
  writeServerDocumentSnapshot(identity, {
    document: editNode(document, "text", { text: "계정 7의 편집" }),
    images: {},
    review: false,
  });
  useAuthStore.setState({
    user: { id: 8, name: "다른 판매자", role: "ARTISAN" },
  });
  const other = await setup();
  expect(screen.queryByText("계정 7의 편집")).not.toBeInTheDocument();
  other.unmount();
  useAuthStore.setState({ user: { id: 7, name: "판매자", role: "ARTISAN" } });
  version = 4;
  await setup();
  expect(screen.queryByText("계정 7의 편집")).not.toBeInTheDocument();
  expect(screen.getByText("원본 문구")).toBeVisible();
});

it("헤더 이동 guard가 동기 저장한 미전송 문구를 다시 열고 서버에 저장한다", async () => {
  const first = await setup();
  editText("이동 직전 편집");
  let allowed = false;
  act(() => {
    allowed = first.runtime.canNavigate!();
  });
  expect(allowed).toBe(true);
  expect(requests).toEqual([]);
  first.unmount();
  await setup();
  expect(screen.getByText("이동 직전 편집")).toBeVisible();
  await save();
  expect(requests).toEqual([[{ nodeId: "text", text: "이동 직전 편집" }]]);
});

it("사진 presign·3개 PUT·교체를 완료한 뒤 imageId PATCH와 복원 가능한 사진을 저장한다", async () => {
  const { container } = await setup();
  fireEvent.click(screen.getByRole("button", { name: "사진 추가" }));
  fireEvent.change(screen.getByLabelText("편집 사진 첨부"), {
    target: {
      files: [new File(["photo"], "photo.png", { type: "image/png" })],
    },
  });
  const pick = await screen.findByRole("button", { name: "사진 2 사용" });
  expect(uploadedVariants.sort()).toEqual(["1280w", "320w", "640w"]);
  fireEvent.click(container.querySelector('[data-node-id="photo"]')!);
  fireEvent.click(pick);
  await save();
  expect(requests).toEqual([[{ nodeId: "photo", imageId: "uploaded-photo" }]]);
  expect(
    readServerDocumentSnapshot({ ...identity, version: 4 })?.images[
      "uploaded-photo"
    ],
  ).toMatch(/^data:image\/webp;base64,/);
});

it("사진 PUT 실패 시 기존 사진을 유지하며 업로드 중에는 header 이동을 차단한다", async () => {
  const view = await setup();
  failUpload = true;
  uploadDelay = 80;
  fireEvent.click(screen.getByRole("button", { name: "사진 추가" }));
  fireEvent.change(screen.getByLabelText("편집 사진 첨부"), {
    target: {
      files: [new File(["photo"], "photo.png", { type: "image/png" })],
    },
  });
  let allowed = true;
  act(() => {
    allowed = view.runtime.canNavigate!();
  });
  expect(allowed).toBe(false);
  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent("사진 업로드에 실패"),
  );
  expect(
    screen.queryByRole("button", { name: "사진 2 사용" }),
  ).not.toBeInTheDocument();
  expect(
    view.container.querySelector('[data-node-id="photo"]')?.getAttribute("src"),
  ).toMatch(/\/seller-demos\/1\/hero.webp$/);
});

it.each(["PENDING_REVIEW", "APPROVED", "PUBLISHED"] as const)(
  "%s에서는 내용과 사진을 수정하지 못한다",
  async (status) => {
    await setup(content(status));
    expect(
      screen.queryByRole("textbox", { name: "텍스트 편집" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "임시 저장" })).toBeDisabled();
    expect(screen.getByLabelText("편집 사진 첨부")).toBeDisabled();
    expect(requests).toEqual([]);
  },
);

it("실제 상품 미리보기의 기기 전환과 편집 복귀가 미저장 문구를 유지한다", async () => {
  const { container } = await setup();
  editText("미리보기 왕복 문구");
  fireEvent.click(screen.getByRole("button", { name: "미리보기" }));
  const frame =
    screen.getByTitle<HTMLIFrameElement>("상품 상세페이지 미리보기");
  fireEvent.load(frame);
  await within(frame.contentDocument!.body).findByRole("heading", {
    name: "판매 작품",
    level: 1,
  });
  fireEvent.click(screen.getByRole("button", { name: "모바일" }));
  expect(container.querySelector(".ss-review-device")).toHaveClass("mobile");
  fireEvent.click(screen.getByRole("button", { name: "뒤로가기" }));
  expect(screen.getByText("미리보기 왕복 문구")).toBeVisible();
  expect(requests).toEqual([]);
});
