import type { CSSProperties } from "react";

import {
  type DocumentNode,
  flattenDocument,
  type NodePatch,
  parseDocument,
  type StudioDocument,
} from "@/utils/seller-studio/document";

export const TEXT_STYLES = [
  {
    id: "headline",
    label: "헤드라인",
    fontSize: 28,
    lineHeight: 1.3,
    fontWeight: 600,
  },
  {
    id: "title",
    label: "제목",
    fontSize: 22,
    lineHeight: 1.2,
    fontWeight: 600,
  },
  {
    id: "subtitle",
    label: "소제목",
    fontSize: 17,
    lineHeight: 1.3,
    fontWeight: 600,
  },
  { id: "body", label: "본문", fontSize: 16, lineHeight: 1.4, fontWeight: 400 },
  {
    id: "small",
    label: "작은 본문",
    fontSize: 13,
    lineHeight: 1.4,
    fontWeight: 400,
  },
  {
    id: "caption",
    label: "캡션",
    fontSize: 10,
    lineHeight: 1.4,
    fontWeight: 400,
  },
] as const;

export const PAGE_LAYOUTS = [
  { id: "text", label: "텍스트" },
  { id: "text-image-right", label: "텍스트 + 오른쪽 사진" },
  { id: "text-image-left", label: "왼쪽 사진 + 텍스트" },
  { id: "image-1", label: "사진 1개" },
  { id: "image-2", label: "사진 2개" },
  { id: "image-3", label: "사진 3개" },
] as const;

export function findNode(
  document: StudioDocument,
  id: string,
): DocumentNode | undefined {
  return flattenDocument(document).find((node) => node.id === id);
}

function descendants(node: DocumentNode): DocumentNode[] {
  return [node, ...(node.children?.flatMap(descendants) ?? [])];
}

function groupText(node: DocumentNode): string {
  return descendants(node)
    .filter((child) => child.type === "text")
    .map((child) => child.value ?? "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function sectionTitle(section: DocumentNode): string {
  const nodes = descendants(section);
  const heading = nodes.find(
    (node) => /^h[1-4]$/.test(node.tag ?? "") && groupText(node),
  );
  if (heading) return groupText(heading).slice(0, 48);

  let title = "";
  let largestFontSize = 0;
  for (const node of nodes) {
    const fontSize = Number.parseFloat(
      String(node.props?.style?.fontSize ?? ""),
    );
    if (!Number.isFinite(fontSize) || fontSize <= largestFontSize) continue;
    const text = groupText(node);
    if (text) {
      title = text;
      largestFontSize = fontSize;
    }
  }
  if (!title) {
    const firstText = nodes.find(
      (node) => node.type === "text" && node.value?.trim(),
    );
    title = firstText ? groupText(firstText) : "빈 페이지";
  }
  return title.slice(0, 48);
}
function mapNodes(
  nodes: DocumentNode[],
  transform: (node: DocumentNode) => DocumentNode,
): DocumentNode[] {
  const mapped = nodes.map((node) => {
    const children = node.children
      ? mapNodes(node.children, transform)
      : undefined;
    return transform(children !== node.children ? { ...node, children } : node);
  });
  return mapped.every((node, index) => node === nodes[index]) ? nodes : mapped;
}

function withRoot(
  document: StudioDocument,
  root: DocumentNode[],
): StudioDocument {
  if (root === document.root) return document;
  const next = { ...document, root };
  // 로컬 구조 편집도 서버 원본과 동일한 노드 수·깊이·ID 제한을 따른다.
  parseDocument(next);
  return next;
}

function createIdFactory(document: StudioDocument): () => string {
  const used = new Set(flattenDocument(document).map((node) => node.id));
  return () => {
    let id: string;
    do {
      id = `studio-${crypto.randomUUID()}`;
    } while (used.has(id));
    used.add(id);
    return id;
  };
}

function safeStyle(style: CSSProperties): CSSProperties {
  return (
    parseDocument({
      schemaVersion: "2.0",
      canvasWidth: 774,
      root: [{ id: "style", type: "element", tag: "p", props: { style } }],
    }).root[0].props?.style ?? {}
  );
}

export function updateText(
  document: StudioDocument,
  nodeId: string,
  text: string,
): StudioDocument {
  return withRoot(
    document,
    mapNodes(document.root, (node) =>
      node.id === nodeId && node.type === "text" && node.value !== text
        ? { ...node, value: text }
        : node,
    ),
  );
}

export function styleText(
  document: StudioDocument,
  nodeId: string,
  style: CSSProperties,
): StudioDocument {
  const target = findNode(document, nodeId);
  if (target?.type !== "text") return document;
  const patch = safeStyle(style);
  if (!Object.keys(patch).length) return document;
  const nextId = createIdFactory(document);
  const wrap = (node: DocumentNode): DocumentNode => ({
    id: nextId(),
    type: "element",
    tag: "span",
    props: {
      style: { ...patch, ...(patch.textAlign ? { display: "block" } : {}) },
    },
    children: [node],
  });
  const root = mapNodes(document.root, (node) => {
    if (!node.children?.some((child) => child.id === nodeId)) return node;
    // 원본 p가 여러 문구·br·이미지를 공유하면 부모 서식이 이웃에 전파되지 않게 격리한다.
    if (node.children.length > 1) {
      return {
        ...node,
        children: node.children.map((child) =>
          child.id === nodeId ? wrap(child) : child,
        ),
      };
    }
    return {
      ...node,
      props: {
        ...node.props,
        style: {
          ...node.props?.style,
          ...patch,
          ...(patch.textAlign &&
          ["span", "strong", "em", "b", "i", "u"].includes(node.tag ?? "")
            ? { display: "block" as const }
            : {}),
        },
      },
    };
  });
  return withRoot(
    document,
    root.map((node) => (node.id === nodeId ? wrap(node) : node)),
  );
}

function textElement(
  nextId: () => string,
  styleId: string,
  value: string,
): DocumentNode {
  const { fontSize, lineHeight, fontWeight } =
    TEXT_STYLES.find((item) => item.id === styleId) ?? TEXT_STYLES[3];
  return {
    id: nextId(),
    type: "element",
    tag: "p",
    props: { style: { margin: 0, fontSize, lineHeight, fontWeight } },
    children: [{ id: nextId(), type: "text", value }],
  };
}

export function addText(
  document: StudioDocument,
  sectionId: string | undefined,
  styleId: string,
): { document: StudioDocument; nodeId: string } {
  const section =
    document.root.find((node) => node.id === sectionId) ?? document.root[0];
  if (!section || section.type !== "element") return { document, nodeId: "" };
  const element = textElement(
    createIdFactory(document),
    styleId,
    "텍스트를 입력하세요.",
  );
  return {
    document: withRoot(
      document,
      document.root.map((node) =>
        node.id === section.id
          ? { ...node, children: [...(node.children ?? []), element] }
          : node,
      ),
    ),
    nodeId: element.children![0].id,
  };
}

export function deleteNode(
  document: StudioDocument,
  nodeId: string,
): StudioDocument {
  if (document.root.length === 1 && document.root[0].id === nodeId)
    return document;
  const remove = (nodes: DocumentNode[]): DocumentNode[] => {
    const remaining = nodes
      .filter((node) => node.id !== nodeId)
      .map((node) => {
        const children = node.children ? remove(node.children) : undefined;
        return children !== node.children ? { ...node, children } : node;
      });
    return remaining.length === nodes.length &&
      remaining.every((node, index) => node === nodes[index])
      ? nodes
      : remaining;
  };
  return withRoot(document, remove(document.root));
}

export function setSectionBackground(
  document: StudioDocument,
  sectionId: string,
  color: string,
): StudioDocument {
  const patch = safeStyle({ backgroundColor: color });
  if (!patch.backgroundColor) return document;
  return withRoot(
    document,
    document.root.map((node) =>
      node.id === sectionId && node.type === "element"
        ? {
            ...node,
            props: { ...node.props, style: { ...node.props?.style, ...patch } },
          }
        : node,
    ),
  );
}
export function addSection(
  document: StudioDocument,
  afterId: string | undefined,
  layoutId: string,
): { document: StudioDocument; sectionId: string } {
  const nextId = createIdFactory(document);
  const layout =
    PAGE_LAYOUTS.find((item) => item.id === layoutId)?.id ?? "text";
  const textBlock: DocumentNode = {
    id: nextId(),
    type: "element",
    tag: "div",
    props: { style: { display: "flex", flexDirection: "column", gap: 24 } },
    children: [
      textElement(nextId, "headline", ""),
      textElement(nextId, "body", ""),
    ],
  };
  const image = (): DocumentNode => ({
    id: nextId(),
    type: "element",
    tag: "img",
    props: {
      alt: "",
      style: {
        display: "block",
        width: "100%",
        maxWidth: "100%",
        height: 320,
        objectFit: "cover",
      },
    },
    children: [],
  });
  let children: DocumentNode[];
  let style: CSSProperties;
  if (layout === "text") {
    children = [textBlock];
    style = {
      width: 505,
      maxWidth: "100%",
      marginLeft: "auto",
      marginRight: "auto",
    };
  } else {
    const split = layout === "text-image-left" || layout === "text-image-right";
    const columns =
      split || layout === "image-2" ? 2 : layout === "image-3" ? 3 : 1;
    children = split
      ? layout === "text-image-left"
        ? [image(), textBlock]
        : [textBlock, image()]
      : Array.from({ length: columns }, image);
    style = {
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: 24,
      alignItems: "center",
      width: 666,
      maxWidth: "100%",
      marginLeft: "auto",
      marginRight: "auto",
    };
  }
  const section: DocumentNode = {
    id: nextId(),
    type: "element",
    tag: "section",
    props: {
      style: { backgroundColor: "#fff", paddingTop: 120, paddingBottom: 120 },
    },
    children: [
      { id: nextId(), type: "element", tag: "div", props: { style }, children },
    ],
  };
  const index = document.root.findIndex((node) => node.id === afterId);
  const root = [...document.root];
  root.splice(index < 0 ? root.length : index + 1, 0, section);
  return { document: withRoot(document, root), sectionId: section.id };
}

export function duplicateSection(
  document: StudioDocument,
  sectionId: string,
): { document: StudioDocument; sectionId: string } {
  const index = document.root.findIndex((node) => node.id === sectionId);
  if (index < 0) return { document, sectionId };
  const nextId = createIdFactory(document);
  const duplicate = (node: DocumentNode): DocumentNode => ({
    ...node,
    id: nextId(),
    ...(node.props
      ? {
          props: {
            ...node.props,
            ...(node.props.style ? { style: { ...node.props.style } } : {}),
          },
        }
      : {}),
    ...(node.children ? { children: node.children.map(duplicate) } : {}),
  });
  const copy = duplicate(document.root[index]);
  const root = [...document.root];
  root.splice(index + 1, 0, copy);
  return { document: withRoot(document, root), sectionId: copy.id };
}

export function moveSection(
  document: StudioDocument,
  sectionId: string,
  toIndex: number,
): StudioDocument {
  const index = document.root.findIndex((node) => node.id === sectionId);
  if (index < 0 || !Number.isFinite(toIndex)) return document;
  const destination = Math.max(
    0,
    Math.min(document.root.length - 1, Math.trunc(toIndex)),
  );
  if (index === destination) return document;
  const root = [...document.root];
  const [section] = root.splice(index, 1);
  root.splice(destination, 0, section);
  return withRoot(document, root);
}

export function replaceImage(
  document: StudioDocument,
  nodeId: string,
  imageId: string,
): StudioDocument {
  if (!imageId) return document;
  return withRoot(
    document,
    mapNodes(document.root, (node) => {
      if (node.id !== nodeId || node.tag !== "img") return node;
      const props = { ...node.props, imageId };
      delete props.src;
      return { ...node, props };
    }),
  );
}

export function supportedPatches(
  before: StudioDocument,
  after: StudioDocument,
): NodePatch[] {
  const original = new Map(
    flattenDocument(before).map((node) => [node.id, node]),
  );
  return flattenDocument(after).flatMap((node): NodePatch[] => {
    const previous = original.get(node.id);
    if (!previous) return [];
    if (
      node.type === "text" &&
      previous.type === "text" &&
      previous.value !== node.value
    ) {
      return [{ nodeId: node.id, text: node.value ?? "" }];
    }
    if (
      node.tag === "img" &&
      previous.tag === "img" &&
      node.props?.imageId &&
      previous.props?.imageId !== node.props.imageId
    ) {
      return [{ nodeId: node.id, imageId: node.props.imageId }];
    }
    return [];
  });
}
