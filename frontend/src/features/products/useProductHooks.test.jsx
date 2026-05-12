import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "../../tests/msw/server.js";
import { useProducts, useProduct, useDeleteProduct } from "./useProductHooks.js";

// Wraps hooks with a fresh QueryClient (no retries, no stale time) so
// network behaviour is deterministic test-to-test. The default global
// MSW handlers are reused unless a test overrides them.
const renderWithClient = (hook) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    ...renderHook(hook, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    }),
  };
};

const API = "http://localhost:5000/api/v1";

describe("useProducts", () => {
  it("fetches the product list from /products", async () => {
    const { result } = renderWithClient(() => useProducts());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.items).toHaveLength(1);
    expect(result.current.data.items[0].slug).toBe("whey-protein-2lb");
  });

  it("surfaces server errors via isError", async () => {
    server.use(
      http.get(`${API}/products`, () =>
        HttpResponse.json({ status: "fail" }, { status: 500 })
      )
    );

    const { result } = renderWithClient(() => useProducts());
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useProduct", () => {
  it("fetches a single product by slug", async () => {
    const { result } = renderWithClient(() => useProduct("whey-protein-2lb"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.product.slug).toBe("whey-protein-2lb");
  });

  it("surfaces the renamed-slug envelope via __redirect", async () => {
    server.use(
      http.get(`${API}/products/old-slug`, () =>
        HttpResponse.json({ status: "redirect", redirect: "/product/new-slug" })
      )
    );

    const { result } = renderWithClient(() => useProduct("old-slug"));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data.__redirect).toBe("/product/new-slug");
  });
});

describe("useDeleteProduct", () => {
  it("invalidates the products query on a successful delete", async () => {
    server.use(
      http.delete(`${API}/products/:id`, () =>
        HttpResponse.json({ status: "success", message: "Product deleted" })
      )
    );

    const { result, queryClient } = renderWithClient(() => useDeleteProduct());
    const spy = vi.spyOn(queryClient, "invalidateQueries");

    await result.current.mutateAsync("p1");

    // The hook invalidates the top-level ['products'] key + at least one
    // detail key (extra calls cover the slug/id specific caches).
    expect(spy).toHaveBeenCalled();
    const invalidatedKey = spy.mock.calls[0][0]?.queryKey;
    expect(Array.isArray(invalidatedKey)).toBe(true);
    expect(invalidatedKey[0]).toBe("products");
  });
});
