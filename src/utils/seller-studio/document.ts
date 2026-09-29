import type { CSSProperties } from "react";

export interface DocumentNode {
  id: string;
  type: "element" | "text";
  tag?: string;
  value?: string;
  props?: {
    imageId?: string;
    src?: string;
    alt?: string;
    style?: CSSProperties;
  };
  children?: DocumentNode[];
}
export interface StudioDocument {
  schemaVersion: string;
  canvasWidth: number;
  root: DocumentNode[];
}
export interface NodePatch {
  nodeId: string;
  text?: string;
  imageId?: string;
}
const tags = new Set([
  "section",
  "article",
  "table",
  "caption",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
  "div",
  "h1",
  "h2",
  "h3",
  "h4",
  "p",
  "span",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "br",
  "ul",
  "ol",
  "li",
  "figure",
  "figcaption",
  "img",
]);
const styleKeys = new Set([
  "color",
  "backgroundColor",
  "fontSize",
  "fontWeight",
  "fontFamily",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "borderWidth",
  "borderColor",
  "borderStyle",
  "borderRadius",
  "display",
  "gap",
  "flexDirection",
  "flexWrap",
  "alignItems",
  "justifyContent",
  "gridTemplateColumns",
  "width",
  "maxWidth",
  "height",
  "minHeight",
  "objectFit",
  "opacity",
]);
export function safeImageUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\"))
    return value;
  try {
    const url = new URL(value);
    if (url.protocol === "https:" || url.protocol === "http:") return url.href;
  } catch {
    /* invalid image */
  }
}
function safeStyle(raw: unknown): CSSProperties {
  if (!raw || typeof raw !== "object") return {};
  const entries = Object.entries(raw).filter(
    ([key, value]) =>
      styleKeys.has(key) &&
      (typeof value === "number"
        ? Number.isFinite(value) && Math.abs(value) <= 3000
        : typeof value === "string" &&
          value.length < 160 &&
          !/url\s*\(|expression|[<>;{}]/i.test(value)),
  );

  const result = Object.fromEntries(entries) as CSSProperties;
  const values = raw as Record<string, unknown>;
  for (const field of ["padding", "margin"] as const) {
    const edge = values[field];
    if (edge && typeof edge === "object") {
      const sides = ["top", "right", "bottom", "left"].map(
        (side) => (edge as Record<string, unknown>)[side],
      );
      if (
        sides.every(
          (value) => typeof value === "number" && value >= 0 && value <= 120,
        )
      )
        result[field] = sides.map((value) => value + "px").join(" ");
    }
  }
  return result;
}
export function parseDocument(input: unknown): StudioDocument {
  const fail = () => {
    throw new Error(
      "AI 문서 형식을 확인할 수 없습니다. 다시 조회하거나 관리자에게 문의해 주세요.",
    );
  };
  if (!input || typeof input !== "object") return fail();
  const raw = input as Record<string, unknown>;
  if (
    !Array.isArray(raw.root) ||
    raw.root.length === 0 ||
    raw.schemaVersion !== "2.0"
  )
    return fail();
  const ids = new Set<string>();
  let count = 0;
  const visit = (value: unknown, depth: number): DocumentNode => {
    if (depth > 24 || ++count > 2500 || !value || typeof value !== "object")
      return fail();
    const node = value as Record<string, unknown>;
    if (
      typeof node.id !== "string" ||
      !node.id ||
      node.id.length > 200 ||
      ids.has(node.id)
    )
      return fail();
    ids.add(node.id);
    if (node.type === "text") {
      if (typeof node.value !== "string" || node.value.length > 50000)
        return fail();
      return { id: node.id, type: "text", value: node.value };
    }
    if (
      node.type !== "element" ||
      typeof node.tag !== "string" ||
      !tags.has(node.tag)
    )
      return fail();
    const props = (
      node.props && typeof node.props === "object" ? node.props : {}
    ) as Record<string, unknown>;
    const style = safeStyle(props.style);
    const layout = props.layout as Record<string, unknown> | undefined;
    if (layout && typeof layout === "object") {
      if (
        layout.display === "grid" &&
        typeof layout.columns === "number" &&
        layout.columns >= 1 &&
        layout.columns <= 4
      ) {
        style.display = "grid";
        style.gridTemplateColumns = `repeat(${Math.floor(layout.columns)},minmax(0,1fr))`;
      } else if (layout.display === "stack" || layout.display === "flex") {
        style.display = "flex";
        style.flexDirection = layout.direction === "row" ? "row" : "column";
      }
      if (
        typeof layout.gap === "number" &&
        layout.gap >= 0 &&
        layout.gap <= 120
      )
        style.gap = layout.gap;
    }
    return {
      id: node.id,
      type: "element",
      tag: node.tag,
      props: {
        ...(typeof props.imageId === "string"
          ? { imageId: props.imageId }
          : {}),
        src: safeImageUrl(props.src ?? props.url ?? props.imageUrl),
        alt: typeof props.alt === "string" ? props.alt : "",
        style,
      },
      children: Array.isArray(node.children)
        ? node.children.map((child) => visit(child, depth + 1))
        : [],
    };
  };
  return {
    schemaVersion: "2.0",
    canvasWidth:
      typeof raw.canvasWidth === "number" &&
      raw.canvasWidth >= 320 &&
      raw.canvasWidth <= 1600
        ? raw.canvasWidth
        : 774,
    root: raw.root.map((node) => visit(node, 0)),
  };
}
export function flattenDocument(doc: StudioDocument): DocumentNode[] {
  const result: DocumentNode[] = [];
  const visit = (nodes: DocumentNode[]) =>
    nodes.forEach((node) => {
      result.push(node);
      if (node.children) visit(node.children);
    });
  visit(doc.root);
  return result;
}
export function editNode(
  doc: StudioDocument,
  id: string,
  patch: Omit<NodePatch, "nodeId">,
): StudioDocument {
  const visit = (nodes: DocumentNode[]): DocumentNode[] =>
    nodes.map((node) => {
      if (node.id === id) {
        if (node.type === "text" && patch.text !== undefined)
          return { ...node, value: patch.text };
        if (node.tag === "img" && patch.imageId !== undefined)
          return {
            ...node,
            props: { ...node.props, imageId: patch.imageId, src: undefined },
          };
      }
      return {
        ...node,
        ...(node.children ? { children: visit(node.children) } : {}),
      };
    });
  return { ...doc, root: visit(doc.root) };
}
export function patchesBetween(
  before: StudioDocument,
  after: StudioDocument,
): NodePatch[] {
  const original = new Map(
    flattenDocument(before).map((node) => [node.id, node]),
  );
  return flattenDocument(after).flatMap((node): NodePatch[] => {
    const old = original.get(node.id);
    if (!old)
      throw new Error("서버 문서 구조가 변경되었습니다. 다시 조회해 주세요.");
    if (node.type === "text" && old.value !== node.value)
      return [{ nodeId: node.id, text: node.value ?? "" }];
    if (
      node.tag === "img" &&
      old.props?.imageId !== node.props?.imageId &&
      node.props?.imageId
    )
      return [{ nodeId: node.id, imageId: node.props.imageId }];
    return [];
  });
}

/** 서버 objectKey는 .../{imageId}/{variant}.webp 구조다. 순서 기반 추정은 하지 않는다. */
export function imageReferences(
  urls: string[],
  ids: string[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const id of ids) {
    const match = urls.find((url) => {
      const safe = safeImageUrl(url);
      if (!safe) return false;
      try {
        return new URL(safe, "https://placeholder.invalid").pathname
          .split("/")
          .includes(id);
      } catch {
        return false;
      }
    });
    if (match) result[id] = match;
  }
  return result;
}
