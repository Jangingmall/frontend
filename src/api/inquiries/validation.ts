import { z } from "zod";

export const inquiryInputDto = z
  .object({
    type: z.enum(["상품 상세문의", "배송", "기타"]),
    title: z.string().trim().max(30),
    body: z.string().trim().min(1).max(2000),
    isSecret: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "기타" && !value.title)
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: "문의 제목을 입력해주세요.",
      });
  });
export const inquiryDto = z
  .object({
    id: z.number().int(),
    type: z.enum(["상품 상세문의", "배송", "기타"]),
    title: z.string(),
    author: z.string(),
    createdAt: z.string(),
    isSecret: z.boolean(),
    canRead: z.boolean(),
    status: z.enum(["WAITING", "ANSWERED"]),
    body: z.string().nullable(),
    reply: z
      .object({ author: z.string(), body: z.string(), createdAt: z.string() })
      .passthrough()
      .nullable(),
  })
  .passthrough();
export const inquiryListDto = z
  .object({
    items: z.array(inquiryDto),
    totalCount: z.number().int().nonnegative(),
  })
  .passthrough();
export type InquiryDto = z.infer<typeof inquiryDto>;
export type InquiryListDto = z.infer<typeof inquiryListDto>;

export const backendInquiryInputDto = z.object({
  content: z.string().trim().min(1).max(1000),
  secret: z.boolean(),
});
export const backendCreatedInquiryDto = z.object({
  questionId: z.number().int().positive().safe(),
  productId: z.number().int().positive().safe(),
  writerId: z.number().int().positive().safe(),
  content: z.string(),
  secret: z.boolean(),
  createdAt: z.string(),
  answer: z.null(),
});
