import { z } from "zod";

/**
 * `POST /api/images/presigned-url` 응답 검증 스키마.
 * (`ImageController`/`ImageService.PresignedUpload`, `docs/api-contract.md` §8)
 */
export const presignedUploadDto = z
  .object({
    imageId: z.string(),
    uploads: z.array(
      z
        .object({
          variant: z.string(),
          objectKey: z.string(),
          presignedUrl: z.string(),
        })
        .passthrough(),
    ),
    expiresInSeconds: z.number().int(),
  })
  .passthrough();

export type PresignedUploadDto = z.infer<typeof presignedUploadDto>;
