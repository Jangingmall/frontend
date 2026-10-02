import { z } from "zod";

import { productSchema } from "@/api/seller-studio/api";
import {
  type DocumentNode,
  parseDocument,
  type StudioDocument,
} from "@/utils/seller-studio/document";

import {
  draftSchema,
  type StudioAsset,
  type StudioSection,
} from "./studio-contract";

export function visitNodes(node: DocumentNode): DocumentNode[] {
  return [node, ...(node.children ?? []).flatMap(visitNodes)];
}
function fields(node: DocumentNode) {
  const texts = visitNodes(node).filter((item) => item.type === "text");
  return {
    texts,
    images: visitNodes(node).filter((item) => item.tag === "img"),
  };
}
function extraFields(texts: DocumentNode[]) {
  const groups: { title?: DocumentNode; description?: DocumentNode }[] = [];
  for (let i = 3; i < texts.length;) {
    if ((texts[i].value?.length ?? 0) > 80)
      groups.push({ description: texts[i++] });
    else groups.push({ title: texts[i++], description: texts[i++] });
  }
  return groups;
}
function originalVariant(node: DocumentNode): StudioSection["variant"] {
  const color = node.props?.style?.backgroundColor;
  if (color === "#121b29" || color === "#121c2a") return "ink";
  if (color === "#eef1f0" || color === "#eef1f2") return "soft";
  return "paper";
}
export function createDemoDraft(document: StudioDocument, name: string) {
  const assets = new Map<string, StudioAsset>();
  const pages = document.root.map((node, index): StudioSection => {
    const { texts, images } = fields(node);
    for (const image of images) {
      const imageId = image.props?.imageId ?? image.props?.src ?? "";
      assets.set(imageId, {
        imageId,
        url: image.props?.src ?? imageId,
        width: 774,
        height: 774,
        alt: image.props?.alt ?? `${name} 사진`,
        asset_mode: "source",
        product_generated: false,
        fidelity_status: "VERIFIED",
      });
    }
    return {
      section_id: `demo-page-${index + 1}`,
      sourceSectionId: node.id,
      block_type: index === 0 ? "hero" : "statement",
      eyebrow: texts[0]?.value ?? "",
      title: texts[1]?.value ?? "",
      body: texts[2]?.value ?? "",
      variant: originalVariant(node),
      photo_id: images[0]?.props?.imageId ?? "",
      photo_ids: images.map((image) => image.props?.imageId ?? ""),
      items: extraFields(texts).map(({ title, description }) => ({
        title: title?.value ?? "",
        description: description?.value ?? "",
      })),
    };
  });
  const draft = draftSchema.parse({
    product_name: name,
    product_type: null,
    summary: pages[0].body || name,
    hero_headline: pages[0].title || name,
    hero_description: pages[0].body || name,
    usage_scene: "",
    features: [],
    keywords: [],
    layout_id: "editorial-split",
    page_plan: pages,
  });
  return { draft, assets: [...assets.values()] };
}

/** 원본의 노드·표·갤러리 구조를 유지하고 편집한 값만 반영한다. */
export function renderDemoSection(
  source: StudioDocument,
  section: StudioSection,
  layout = "editorial-split",
): StudioDocument | undefined {
  const original = source.root.find(
    (node) => node.id === section.sourceSectionId,
  );
  if (!original) return;
  const node = structuredClone(original);
  const { texts, images } = fields(node);
  [section.eyebrow, section.title, section.body].forEach((value, index) => {
    if (texts[index]) texts[index].value = value;
  });
  const insertField = (
    anchor: DocumentNode | undefined,
    value: string | undefined,
    before: boolean,
  ) => {
    if (!anchor || !value) return;
    const parent = visitNodes(node).find((item) =>
      item.children?.includes(anchor),
    );
    if (!parent?.children) return;
    const index = parent.children.indexOf(anchor) + (before ? 0 : 1);
    parent.children.splice(index, 0, {
      id: `${anchor.id}-added-${before}`,
      type: "element",
      tag: "span",
      props: { style: { display: "block" } },
      children: [
        { id: `${anchor.id}-added-text-${before}`, type: "text", value },
      ],
    });
  };
  extraFields(texts).forEach((group, index) => {
    if (!group.title)
      insertField(group.description, section.items[index]?.title, true);
    if (!group.description)
      insertField(group.title, section.items[index]?.description, false);
    if (group.title)
      group.title.value = section.items[index]?.title ?? group.title.value;
    if (group.description)
      group.description.value =
        section.items[index]?.description ?? group.description.value;
  });
  images.forEach((image, index) => {
    const id = index === 0 ? section.photo_id : section.photo_ids[index];
    if (id) image.props = { ...image.props, imageId: id, src: undefined };
    else {
      image.tag = "div";
      image.props = { style: { display: "none" } };
    }
  });
  // 사진이 없던 페이지에도 기존 사진 도구로 사진을 추가할 수 있다.
  if (!images.length && section.photo_id)
    node.children = [
      ...(node.children ?? []),
      {
        id: `${section.section_id}-photo`,
        type: "element",
        tag: "img",
        props: { imageId: section.photo_id },
      },
    ];
  const baseVariant = originalVariant(original);
  if (section.backgroundEdited || section.variant !== baseVariant) {
    node.props = {
      ...node.props,
      style: {
        ...node.props?.style,
        backgroundColor: { paper: "#ffffff", soft: "#eef1f2", ink: "#121b29" }[
          section.variant
        ],
      },
    };
  }
  for (const element of visitNodes(node)) {
    if (
      element.type === "element" &&
      element.children?.some((child) => child.type === "text")
    ) {
      const style = { ...element.props?.style };
      if (section.textStyle?.align) style.textAlign = section.textStyle.align;
      if (section.textStyle?.color) style.color = section.textStyle.color;
      else if (section.backgroundEdited || section.variant !== baseVariant)
        style.color = section.variant === "ink" ? "#ffffff" : "#121b29";
      if (section.textStyle?.bold !== undefined)
        style.fontWeight = section.textStyle.bold ? 700 : 400;
      if (section.textStyle?.size)
        style.fontSize = section.textStyle.size === "headline" ? 28 : 16;
      element.props = { ...element.props, style };
    }
    element.id = `${section.section_id}-${element.id}`;
  }
  if (layout === "image-first" && node.children) {
    const pureImage = (child: DocumentNode) =>
      visitNodes(child).some((n) => n.tag === "img") &&
      !visitNodes(child).some((n) => n.type === "text");
    node.children = [
      ...node.children.filter(pureImage),
      ...node.children.filter((child) => !pureImage(child)),
    ];
  }
  if (layout === "catalog-grid") {
    for (const child of visitNodes(node)) {
      if (child.props?.style?.display === "grid")
        child.props.style.gridTemplateColumns = "repeat(3, minmax(0, 1fr))";
    }
  }
  return { ...source, root: [node] };
}

const demoAssetSchema = z.object({
  imageId: z.string(),
  url: z
    .string()
    .regex(
      /^(\/seller-demos\/[12]\/[^\\]+|data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+)$/,
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
export const demoSnapshotSchema = z.object({
  product: productSchema.optional(),
  draft: draftSchema,
  assets: z.array(demoAssetSchema).min(1).max(32),
  source: z.unknown().transform(parseDocument),
  status: z.enum(["editing", "result"]),
});
export type DemoSnapshot = z.infer<typeof demoSnapshotSchema>;
export const demoStorageKey = (scenario: string) =>
  `midam-seller-demo-frontend-${scenario}`;
