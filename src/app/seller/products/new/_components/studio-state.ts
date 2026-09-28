import { z } from "zod";

import type {
  StudioAsset,
  StudioDraft,
  StudioSection,
} from "./studio-contract";
import { buildPreview, draftSchema, parseContract } from "./studio-contract";

export const STORAGE_PREFIX = "midam-seller-figma-v1:";
export const inputSchema = z.object({
  name: z.string().trim().min(1).max(15),
  making: z.string().trim().min(1).max(100),
  care: z.string().trim().min(1).max(100),
});
export type StudioInputValues = z.infer<typeof inputSchema>;
export function createDraft(
  values: StudioInputValues,
  assets: StudioAsset[],
): StudioDraft {
  const { name, making, care } = inputSchema.parse(values);
  if (!assets.length || assets.length > 8)
    throw new Error("사진은 1~8장까지 첨부해 주세요.");
  const section = (
    id: string,
    title: string,
    body: string,
    photo = "",
  ): StudioSection => ({
    section_id: id,
    block_type: id === "hero" ? "hero" : "statement",
    eyebrow: "",
    title,
    body,
    photo_id: photo,
    photo_ids: [],
    items: [],
    variant: "paper",
  });
  return draftSchema.parse({
    product_name: name,
    product_type: null,
    summary: making,
    hero_headline: name,
    hero_description: making,
    usage_scene: "",
    features: [],
    keywords: [],
    layout_id: "editorial-split",
    page_plan: [
      section("hero", name, making, assets[0].imageId),
      section("story", "제작 과정 · 상품 설명", making),
      ...assets
        .slice(1)
        .map((asset, index) =>
          section(
            `photo-${index}`,
            `상품 사진 ${index + 2}`,
            "",
            asset.imageId,
          ),
        ),
      section("care", "사용 · 보관 관리 방법", care),
    ],
  });
}
export interface EditorSnapshot {
  draft: StudioDraft;
  assets: StudioAsset[];
}
export interface HistoryState extends EditorSnapshot {
  past: EditorSnapshot[];
  future: EditorSnapshot[];
}
export type HistoryAction =
  | { type: "edit" | "load"; draft: StudioDraft; assets?: StudioAsset[] }
  | { type: "undo" | "redo" }
  | { type: "assets"; assets: StudioAsset[] };
export function historyReducer(
  state: HistoryState,
  action: HistoryAction,
): HistoryState {
  const current = { draft: state.draft, assets: state.assets };
  if (action.type === "assets")
    return {
      ...state,
      assets: action.assets,
      past: [...state.past.slice(-29), current],
      future: [],
    };
  if (action.type === "load")
    return {
      draft: action.draft,
      assets: action.assets ?? state.assets,
      past: [],
      future: [],
    };
  if (action.type === "edit")
    return {
      draft: action.draft,
      assets: action.assets ?? state.assets,
      past: [...state.past.slice(-29), current],
      future: [],
    };
  if (action.type === "undo" && state.past.length)
    return {
      ...state.past.at(-1)!,
      past: state.past.slice(0, -1),
      future: [current, ...state.future],
    };
  if (action.type === "redo" && state.future.length)
    return {
      ...state.future[0],
      past: [...state.past, current],
      future: state.future.slice(1),
    };
  return state;
}
const assetSchema = z.object({
  imageId: z.string(),
  url: z
    .string()
    .regex(
      /^(\/studio\/asset-[13]\.png|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/,
    ),
  width: z.number().positive().max(20000),
  height: z.number().positive().max(20000),
  alt: z.string(),
  asset_mode: z.enum([
    "source",
    "source_crop",
    "source_composite",
    "generated_scene",
    "generated_view",
  ]),
  product_generated: z.boolean(),
  fidelity_status: z.enum(["VERIFIED", "FALLBACK", "GENERATED", "REJECTED"]),
});
export function readSavedDraft(raw: string) {
  const saved = z
    .object({
      draft: draftSchema,
      assets: z.array(assetSchema).min(1).max(8),
      status: z.enum(["draft", "result"]),
    })
    .parse(JSON.parse(raw));
  parseContract(buildPreview(saved.draft), saved.assets);
  return saved;
}
export async function readImages(
  files: File[],
  count: number,
): Promise<StudioAsset[]> {
  if (
    files.length + count > 8 ||
    files.some((file) => file.size > 10 * 1024 * 1024)
  )
    throw new Error("사진은 최대 8장, 장당 10MB까지 첨부할 수 있습니다.");
  if (
    files.some(
      (file) => !["image/png", "image/jpeg", "image/webp"].includes(file.type),
    )
  )
    throw new Error("JPG, PNG, WebP 사진을 선택해 주세요.");
  return Promise.all(
    files.map(async (file) => {
      const bitmap = await createImageBitmap(file);
      const { width, height } = bitmap;
      bitmap.close();
      if (!width || !height || width > 20000 || height > 20000)
        throw new Error("사진 해상도를 확인해 주세요.");
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("사진을 읽지 못했습니다."));
        reader.readAsDataURL(file);
      });
      return {
        imageId: `upload-${crypto.randomUUID()}`,
        url,
        width,
        height,
        alt: file.name,
        asset_mode: "source",
        product_generated: false,
        fidelity_status: "FALLBACK",
      };
    }),
  );
}
