import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, fetchPrivateApi, fetchPublicApi } from "./fetcher";

const fetchMock = vi.fn();

describe("apiFetch", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("combines the server API base URL and unwraps a successful API response", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          status: 200,
          data: { id: 1, name: "백자" },
        }),
        { headers: { "content-type": "application/json" } },
      ),
    );

    await expect(
      apiFetch<{ id: number; name: string }>("/api/products/1", {
        baseUrl: "https://api.example.com/",
      }),
    ).resolves.toEqual({ id: 1, name: "백자" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/products/1",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("throws ApiError with the API failure body", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: false, status: 404, errorCode: "NOT_FOUND" }),
        { status: 404, headers: { "content-type": "application/json" } },
      ),
    );

    await expect(
      apiFetch("/api/products/999", { baseUrl: "https://api.example.com" }),
    ).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      code: "NOT_FOUND",
    });
  });

  it("adds ISR cache options to public API requests", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ success: true, status: 200, data: [] }), {
        headers: { "content-type": "application/json" },
      }),
    );

    await fetchPublicApi("/api/products", {
      baseUrl: "https://api.example.com",
      tags: ["products"],
      revalidate: 300,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/products",
      expect.objectContaining({
        next: { revalidate: 300, tags: ["products"] },
      }),
    );
  });

  it("disables caching for private API requests", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, status: 200, data: { id: 1 } }),
        {
          headers: { "content-type": "application/json" },
        },
      ),
    );

    await fetchPrivateApi("/api/payments/cart", {
      baseUrl: "https://api.example.com",
      headers: { Authorization: "Bearer access-token" },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/api/payments/cart",
      expect.objectContaining({ cache: "no-store" }),
    );
  });
});
