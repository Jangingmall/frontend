import { ApiError } from "./api-error";

async function parseBody(response: Response): Promise<unknown> {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    return undefined;
  }
  const body = await response.text();
  return body ? JSON.parse(body) : undefined;
}

export async function fetcher<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T | undefined> {
  const response = await fetch(input, init);
  const body = await parseBody(response);
  if (!response.ok) throw new ApiError(response.status, body);
  return body as T | undefined;
}
