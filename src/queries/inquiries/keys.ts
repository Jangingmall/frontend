export const inquiryKeys = {
  all: ["inquiries"] as const,
  product: (id: number) => ["inquiries", id] as const,
  list: (
    id: number,
    excludeSecret: boolean,
    viewerId: number | null,
    isMock: boolean,
  ) => ["inquiries", id, { excludeSecret, viewerId, isMock }] as const,
};
