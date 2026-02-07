export type SearchType = "title" | "author";

export type Book = {
  workKey: string;   // "/works/OL123W"
  workId: string;    // "OL123W"
  title: string;
  authorName?: string;
  firstPublishYear?: number;
  coverId?: number;
};

const BASE = "https://openlibrary.org";

function toWorkId(workKey: string) {
  const parts = workKey.split("/");
  return parts[parts.length - 1] || workKey;
}

export async function quickSearchBooks(params: {
  q: string;
  type: SearchType;
  page?: number;
}): Promise<{ books: Book[]; total: number }> {
  const { q, type, page = 1 } = params;
  const query = q.trim();
  if (!query) return { books: [], total: 0 };

  const url = new URL(`${BASE}/search.json`);
  url.searchParams.set(type, query);
  url.searchParams.set("page", String(page));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Open Library: network error");
  const data = await res.json();

  const books: Book[] = (data.docs ?? []).map((d: any) => {
    const workKey = d.key as string;
    return {
      workKey,
      workId: toWorkId(workKey),
      title: d.title ?? "Untitled",
      authorName: Array.isArray(d.author_name) ? d.author_name[0] : undefined,
      firstPublishYear: d.first_publish_year,
      coverId: d.cover_i,
    };
  });

  return { books, total: data.numFound ?? books.length };
}

export function coverUrl(coverId?: number, size: "S" | "M" | "L" = "M") {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export type RecentChange = {
    id: string;
    kind: string;      // ex: "edit", "new", etc.
    timestamp: string; // ISO
    comment?: string;
    author?: string;
    link?: string;     // lien vers openlibrary.org
  };
  
  export async function getRecentChanges(limit = 10): Promise<RecentChange[]> {
    const url = `https://openlibrary.org/recentchanges.json?limit=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("RecentChanges: network error");
    const data = await res.json();
  
    return (data ?? []).map((c: any) => {
      const id = String(c.id ?? crypto.randomUUID?.() ?? Math.random());
      const kind = String(c.kind ?? "change");
      const timestamp = String(c.timestamp ?? "");
      const comment = c.comment ? String(c.comment) : undefined;
  
      const author =
        c.author?.key ? String(c.author.key) :
        c.author ? String(c.author) :
        undefined;
  
      const link = c.changes?.[0]?.key
        ? `https://openlibrary.org${c.changes[0].key}`
        : undefined;
  
      return { id, kind, timestamp, comment, author, link };
    });
  }
  