import { type SellerDemoId } from "@/api/seller-demo/scenarios";
import {
  parseDocument,
  type StudioDocument,
} from "@/utils/seller-studio/document";

import first from "./fixtures/1.json";
import second from "./fixtures/2.json";
const photoPaths: Record<SellerDemoId, Record<string, string>> = {
  "1": {
    hero: "hero.webp",
    "gallery-1": "gallery-1.webp",
    "gallery-2": "gallery-2.webp",
    "gallery-3": "gallery-3.webp",
    "gallery-4": "gallery-4.webp",
    "gallery-5": "gallery-5.webp",
    detail: "detail.webp",
    lifestyle: "lifestyle.webp",
  },
  "2": {
    hero: "photos/01-hero.png",
    "gallery-1": "gallery-1.webp",
    "gallery-2": "gallery-2.webp",
    "gallery-3": "gallery-3.webp",
    "gallery-4": "gallery-4.webp",
    "gallery-5": "gallery-5.webp",
    packshot: "photos/02-packshot.png",
    detail: "photos/03-detail.png",
    lifestyle: "photos/04-lifestyle.png",
    "lifestyle-02": "photos/05-lifestyle-02.png",
    "detail-02": "photos/06-detail-02.png",
    "detail-03": "photos/07-detail-03.png",
    "detail-04": "photos/08-detail-04.png",
    "detail-05": "photos/09-detail-05.png",
  },
};
export function fixture(id: SellerDemoId) {
  const document = parseDocument(id === "1" ? first : second);
  const visit = (nodes: StudioDocument["root"]) =>
    nodes.forEach((node) => {
      if (node.tag === "img" && node.props?.imageId) {
        const path = photoPaths[id][node.props.imageId];
        if (!path) throw new Error("시연 사진이 없습니다.");
        node.props.src = "/seller-demos/" + id + "/" + path;
        node.props.imageId = node.props.src;
      }
      if (node.children) visit(node.children);
    });
  visit(document.root);
  return document;
}
