import { z } from "zod";

export const blockTypes = [
  "hero",
  "statement",
  "feature_grid",
  "detail_split",
  "wide_image",
  "gallery",
  "usage_scene",
  "scale_reference",
  "palette",
  "recommendation",
  "info_table",
  "notice",
  "closing",
] as const;
export const sectionSchema = z.strictObject({
  section_id: z.string().regex(/^[a-zA-Z][\w-]{0,60}$/),
  block_type: z.enum(blockTypes),
  eyebrow: z.string().max(120),
  title: z.string().max(80),
  body: z.string().max(300),
  variant: z.enum(["paper", "ink", "soft"]),
  photo_id: z.string(),
  photo_ids: z.array(z.string()).max(12),
  items: z
    .array(
      z.strictObject({
        title: z.string().max(80),
        description: z.string().max(300),
      }),
    )
    .max(8),
});
export const draftSchema = z
  .strictObject({
    product_name: z.string().trim().min(1).max(120),
    product_type: z.string().max(120).nullable(),
    summary: z.string().trim().min(1).max(500),
    hero_headline: z.string().trim().min(1).max(80),
    hero_description: z.string().trim().min(1).max(300),
    usage_scene: z.string().max(300),
    features: z
      .array(
        z.strictObject({
          title: z.string(),
          description: z.string(),
          evidence: z.string(),
          confidence: z.number().min(0).max(1),
        }),
      )
      .max(3),
    keywords: z.array(z.string()).max(8),
    layout_id: z.enum(["editorial-split", "image-first", "catalog-grid"]),
    page_plan: z.array(sectionSchema).min(1).max(14),
  })
  .refine(
    (draft) =>
      new Set(draft.page_plan.map((section) => section.section_id)).size ===
      draft.page_plan.length,
    "섹션 ID가 중복됩니다.",
  );
export type StudioDraft = z.infer<typeof draftSchema>;
export type StudioSection = z.infer<typeof sectionSchema>;
export interface StudioAsset {
  imageId: string;
  url: string;
  width: number;
  height: number;
  alt: string;
  asset_mode:
    | "source"
    | "source_crop"
    | "source_composite"
    | "generated_scene"
    | "generated_view";
  product_generated: boolean;
  fidelity_status: "VERIFIED" | "FALLBACK" | "GENERATED" | "REJECTED";
}
const color = z.string().regex(/^#[\da-fA-F]{6}$/);
const edge = z.strictObject({
  top: z.number().min(0).max(120),
  right: z.number().min(0).max(120),
  bottom: z.number().min(0).max(120),
  left: z.number().min(0).max(120),
});
// 미확정 원시 스타일은 받지 않고 이 화면이 구현한 안전한 부분집합만 허용한다.
const styleSchema = z.strictObject({
  color: color.optional(),
  backgroundColor: color.optional(),
  fontSize: z.number().min(10).max(80).optional(),
  fontWeight: z
    .union([z.literal(400), z.literal(500), z.literal(600), z.literal(700)])
    .optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  padding: edge.optional(),
  margin: edge.optional(),
  fontFamily: z.enum(["sans", "serif", "display"]).optional(),
  lineHeight: z.number().min(0.5).max(5).optional(),
  letterSpacing: z.number().min(-20).max(50).optional(),
  borderWidth: z.number().min(0).max(20).optional(),
  borderColor: color.optional(),
  borderRadius: z.number().min(0).max(999).optional(),
  opacity: z.number().min(0).max(1).optional(),
  objectFit: z.enum(["cover", "contain"]).optional(),
  objectPosition: z
    .strictObject({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    })
    .optional(),
});
const tags = [
  "section",
  "article",
  "div",
  "h2",
  "h3",
  "h4",
  "p",
  "span",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "figure",
  "figcaption",
  "img",
  "table",
  "caption",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
] as const;
type Tag = (typeof tags)[number];
const propsSchema = z.strictObject({
  variant: z.enum(["paper", "ink", "soft"]).optional(),
  style: styleSchema.optional(),
  layout: z
    .discriminatedUnion("display", [
      z.strictObject({
        display: z.literal("stack"),
        gap: z.number().min(0).max(80).optional(),
        align: z.enum(["start", "center", "end", "stretch"]).optional(),
      }),
      z.strictObject({
        display: z.literal("flex"),
        direction: z.enum(["row", "column"]),
        gap: z.number().min(0).max(80).optional(),
        wrap: z.boolean().optional(),
        align: z.enum(["start", "center", "end", "stretch"]).optional(),
      }),
      z.strictObject({
        display: z.literal("grid"),
        columns: z.union([
          z.literal(1),
          z.literal(2),
          z.literal(3),
          z.literal(4),
        ]),
        gap: z.number().min(0).max(80).optional(),
      }),
    ])
    .optional(),
  imageId: z.string().optional(),
  alt: z.string().max(500).optional(),
});
export interface ContractElement {
  id: string;
  type: "element";
  tag: Tag;
  props?: z.infer<typeof propsSchema>;
  children?: ContractNode[];
}
export interface ContractText {
  id: string;
  type: "text";
  value: string;
}
export type ContractNode = ContractElement | ContractText;
export interface ContractDocument {
  schemaVersion: "2.0";
  canvasWidth: number;
  root: ContractElement[];
}
const idSchema = z.string().regex(/^[a-zA-Z][\w-]{0,79}$/);
const nodeSchema: z.ZodType<ContractNode> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.strictObject({
      id: idSchema,
      type: z.literal("text"),
      value: z.string().max(10000),
    }),
    z.strictObject({
      id: idSchema,
      type: z.literal("element"),
      tag: z.enum(tags),
      props: propsSchema.optional(),
      children: z.array(nodeSchema).max(50).optional(),
    }),
  ]),
);
export function parseContract(
  value: unknown,
  assets: StudioAsset[],
): ContractDocument {
  let count = 0;
  function limit(node: unknown, depth: number) {
    if (++count > 300 || depth > 20)
      throw new Error("문서 크기 제한을 초과했습니다.");
    if (
      node &&
      typeof node === "object" &&
      "children" in node &&
      Array.isArray(node.children)
    )
      node.children.forEach((child) => limit(child, depth + 1));
  }
  if (
    value &&
    typeof value === "object" &&
    "root" in value &&
    Array.isArray(value.root)
  )
    value.root.forEach((node) => limit(node, 1));
  const doc = z
    .strictObject({
      schemaVersion: z.literal("2.0"),
      canvasWidth: z.number().int().min(1).max(4096),
      root: z.array(nodeSchema).min(1).max(14),
    })
    .parse(value);
  const ids = new Set<string>();
  const inline = new Set(["span", "strong", "em"]);
  function check(node: ContractNode, parent?: Tag) {
    if (ids.has(node.id)) throw new Error("중복된 노드 ID입니다.");
    ids.add(node.id);
    const rules: Partial<Record<Tag, string[]>> = {
      ul: ["li"],
      ol: ["li"],
      table: ["caption", "thead", "tbody"],
      thead: ["tr"],
      tbody: ["tr"],
      tr: ["th", "td"],
    };
    if (
      parent &&
      rules[parent] &&
      (node.type !== "element" || !rules[parent]!.includes(node.tag))
    )
      throw new Error("잘못된 자식 요소입니다.");
    if (
      parent &&
      ["h2", "h3", "h4", "p", "span", "strong", "em"].includes(parent) &&
      node.type === "element" &&
      !inline.has(node.tag)
    )
      throw new Error("본문 안에 블록 요소를 넣을 수 없습니다.");
    if (node.type === "text") return;
    if (node.tag === "img") {
      if (
        node.children !== undefined ||
        !assets.some(
          (a) =>
            a.imageId === node.props?.imageId &&
            a.fidelity_status !== "REJECTED",
        )
      )
        throw new Error("표시할 수 없는 이미지입니다.");
    } else if (
      node.props?.imageId !== undefined ||
      node.props?.alt !== undefined
    )
      throw new Error("이미지 속성은 img에만 허용됩니다.");
    node.children?.forEach((child) => check(child, node.tag));
  }
  doc.root.forEach((node) => {
    if (node.type !== "element" || node.tag !== "section")
      throw new Error("최상위는 section이어야 합니다.");
    check(node);
  });
  return doc as ContractDocument;
}
export function editSection(
  draft: StudioDraft,
  id: string,
  patch: Partial<StudioSection>,
): StudioDraft {
  const page_plan = draft.page_plan.map((section) =>
    section.section_id === id ? { ...section, ...patch } : section,
  );
  const changed = page_plan.find((section) => section.section_id === id);
  return {
    ...draft,
    page_plan,
    ...(changed?.block_type === "hero"
      ? { hero_headline: changed.title, hero_description: changed.body }
      : {}),
  };
}
// 운영 builder 대신 사용하는 화면 데모. 저장 원본은 draft이고 AST는 파생 결과다.
export function buildPreview(draft: StudioDraft): ContractDocument {
  const text = (id: string, tag: Tag, value: string): ContractElement => ({
    id,
    type: "element",
    tag,
    children: [{ id: `${id}-text`, type: "text", value }],
  });
  return {
    schemaVersion: "2.0",
    canvasWidth: 774,
    root: draft.page_plan.map((section) => {
      const id = `section-${section.section_id}`;
      const copy: ContractNode[] = [
        text(`${id}-eyebrow`, "span", section.eyebrow),
        text(`${id}-title`, "h2", section.title),
        text(`${id}-body`, "p", section.body),
      ];
      const photo: ContractElement | null = section.photo_id
        ? {
            id: `${id}-figure`,
            type: "element",
            tag: "figure",
            children: [
              {
                id: `${id}-image`,
                type: "element",
                tag: "img",
                props: {
                  imageId: section.photo_id,
                  alt: `${draft.product_name} · ${section.title}`,
                },
              },
            ],
          }
        : null;
      const items: ContractElement[] = section.items.map((item, index) => ({
        id: `${id}-item-${index}`,
        type: "element",
        tag: "div",
        children: [
          text(`${id}-item-${index}-title`, "h3", item.title),
          text(`${id}-item-${index}-body`, "p", item.description),
        ],
      }));
      return {
        id,
        type: "element",
        tag: "section",
        props: {
          variant: section.variant,
          layout: { display: "stack", gap: 16 },
        },
        children: [
          ...(draft.layout_id === "image-first" && photo ? [photo] : []),
          { id: `${id}-copy`, type: "element", tag: "div", children: copy },
          ...(draft.layout_id !== "image-first" && photo ? [photo] : []),
          ...(items.length
            ? [
                {
                  id: `${id}-items`,
                  type: "element" as const,
                  tag: "div" as const,
                  props: {
                    layout: {
                      display: "grid" as const,
                      columns:
                        draft.layout_id === "catalog-grid"
                          ? (3 as const)
                          : (2 as const),
                      gap: 16,
                    },
                  },
                  children: items,
                },
              ]
            : []),
        ],
      };
    }),
  };
}
