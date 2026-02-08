import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBookDetails, getRecentChanges, searchBooks } from "./openLibrary";

function createJsonResponse(
  data: unknown,
  options?: { ok?: boolean; status?: number },
): Response {
  const ok = options?.ok ?? true;
  const status = options?.status ?? (ok ? 200 : 500);

  return {
    ok,
    status,
    json: async () => data,
  } as Response;
}

describe("openLibrary service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("retourne une liste vide si aucun critere n'est fourni", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const result = await searchBooks({});

    expect(result).toEqual({ books: [], total: 0 });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("mappe correctement les resultats de recherche", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createJsonResponse({
        numFound: 1,
        docs: [
          {
            key: "/works/OL123W",
            title: "Le Petit Prince",
            author_name: ["Antoine de Saint-Exupery"],
            first_publish_year: 1943,
            cover_i: 999,
          },
        ],
      }),
    );

    const result = await searchBooks({ q: "petit prince", type: "title" });

    expect(result.total).toBe(1);
    expect(result.books).toHaveLength(1);
    expect(result.books[0]).toEqual({
      workKey: "/works/OL123W",
      workId: "OL123W",
      title: "Le Petit Prince",
      authorName: "Antoine de Saint-Exupery",
      firstPublishYear: 1943,
      coverId: 999,
    });

    const calledUrl = new URL(String(fetchSpy.mock.calls[0]?.[0]));
    expect(calledUrl.pathname).toBe("/search.json");
    expect(calledUrl.searchParams.get("title")).toBe("petit prince");
  });

  it("retourne null si le detail d'un livre est introuvable (404)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createJsonResponse({}, { ok: false, status: 404 }),
    );

    const result = await getBookDetails("OL404W");

    expect(result).toBeNull();
  });

  it("retourne seulement les recent changes lies aux livres", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createJsonResponse([
        {
          id: 1,
          kind: "add-book",
          timestamp: "2026-02-08T14:13:00Z",
          comment: "import new book",
          changes: [{ key: "/books/OL1M" }],
        },
        {
          id: 2,
          kind: "new-account",
          timestamp: "2026-02-08T14:12:00Z",
          comment: "Created new account.",
          changes: [{ key: "/people/test-user" }],
        },
      ]),
    );

    const result = await getRecentChanges(10);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: "1",
      kind: "add-book",
      comment: "import new book",
      link: "https://openlibrary.org/books/OL1M",
    });
  });
});
