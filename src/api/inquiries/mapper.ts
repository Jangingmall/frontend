import type { InquiryList, ProductInquiry } from "@/types/inquiry";

import type { InquiryDto, InquiryListDto } from "./validation";

export function mapInquiry(dto: InquiryDto): ProductInquiry {
  return {
    id: dto.id,
    type: dto.type,
    title: dto.title,
    author: dto.author,
    createdAt: dto.createdAt,
    isSecret: dto.isSecret,
    canRead: dto.canRead,
    status: dto.status,
    body: dto.canRead ? dto.body : null,
    reply:
      dto.canRead && dto.reply
        ? {
            author: dto.reply.author,
            body: dto.reply.body,
            createdAt: dto.reply.createdAt,
          }
        : null,
  };
}
export function mapInquiryList(dto: InquiryListDto): InquiryList {
  return { items: dto.items.map(mapInquiry), totalCount: dto.totalCount };
}
