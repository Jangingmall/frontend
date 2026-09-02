import { ApiError } from "./api-error";

type ApiSuccess<T> = {
  success: true;
  status: number;
  data: T;
};

type NextRequestInit = RequestInit & {
  next?: { revalidate?: number; tags?: string[] };
};

type ApiFetchOptions = Omit<NextRequestInit, "body"> & {
  baseUrl?: string;
};

type PublicApiOptions = ApiFetchOptions & {
  tags: string[];
  revalidate: number;
};

async function parseBody(response: Response): Promise<unknown> {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    return undefined;
  }
  const body = await response.text();
  return body ? JSON.parse(body) : undefined;
}

function getUrl(path: string, baseUrl: string) {
  return new URL(
    path,
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  ).toString();
}

function unwrapSuccess<T>(body: unknown): T {
  if (
    typeof body !== "object" ||
    body === null ||
    !("success" in body) ||
    body.success !== true ||
    !("data" in body)
  ) {
    throw new ApiError(502, body);
  }
  return (body as ApiSuccess<T>).data;
}

export async function apiFetch<T>(
  path: string,
  {
    baseUrl = process.env.API_BASE_URL,
    headers,
    ...init
  }: ApiFetchOptions = {},
): Promise<T> {
  if (!baseUrl)
    throw new Error("API_BASE_URL is required for server API requests.");

  const response = await fetch(getUrl(path, baseUrl), {
    ...init,
    headers: new Headers({ Accept: "application/json", ...headers }),
  });
  const body = await parseBody(response);
  if (!response.ok) throw new ApiError(response.status, body);
  return unwrapSuccess<T>(body);
}

export function fetchPublicApi<T>(
  path: string,
  { tags, revalidate, ...options }: PublicApiOptions,
) {
  return apiFetch<T>(path, { ...options, next: { tags, revalidate } });
}

export function fetchPrivateApi<T>(
  path: string,
  options: ApiFetchOptions = {},
) {
  return apiFetch<T>(path, { ...options, cache: "no-store" });
}

export { ApiError } from "./api-error";
