import { serverEnv } from "@/lib/env.server";

import { resolveResponse } from "./response";

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

function getUrl(path: string, baseUrl: string) {
  return new URL(
    path,
    baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`,
  ).toString();
}

export async function apiFetch<T>(
  path: string,
  { baseUrl = serverEnv.apiBaseUrl, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  if (!baseUrl)
    throw new Error("API_BASE_URL is required for server API requests.");

  const response = await fetch(getUrl(path, baseUrl), {
    ...init,
    headers: new Headers({ Accept: "application/json", ...headers }),
  });
  return resolveResponse<T>(response);
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
