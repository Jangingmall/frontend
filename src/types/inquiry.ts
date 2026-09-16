export type InquiryType = "상품 상세문의" | "배송" | "기타";
export interface InquiryInput {
  type: InquiryType;
  title: string;
  body: string;
  isSecret: boolean;
}
export interface ProductInquiry {
  id: number;
  type: InquiryType;
  title: string;
  author: string;
  createdAt: string;
  isSecret: boolean;
  canRead: boolean;
  status: "WAITING" | "ANSWERED";
  body: string | null;
  reply: { author: string; body: string; createdAt: string } | null;
}
export interface InquiryList {
  items: ProductInquiry[];
  totalCount: number;
}
