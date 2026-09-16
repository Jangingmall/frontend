import { z } from "zod";

export const inquiryFormSchema = z
  .object({
    type: z.enum(["상품 상세문의", "배송", "기타"], {
      error: "문의 유형을 선택해주세요.",
    }),
    title: z.string().trim().max(30, "제목은 30자 이내로 입력해주세요."),
    body: z
      .string()
      .trim()
      .min(1, "문의 내용을 입력해주세요.")
      .max(2000, "내용은 2000자 이내로 입력해주세요."),
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
export type InquiryFormValues = z.infer<typeof inquiryFormSchema>;
