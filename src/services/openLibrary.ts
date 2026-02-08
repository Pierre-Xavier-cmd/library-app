import type {
  Book,
  BookDetails,
  RecentChange,
  SearchBooksParams,
} from "./openLibrary.types";

export type { Book, BookDetails, RecentChange, SearchBooksParams, SearchType } from "./openLibrary.types";

const BASE = "https://openlibrary.org";

function toWorkId(workKey: string) {
  const parts = workKey.split("/");
  return parts[parts.length - 1] || workKey;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function parseSearchDoc(rawDoc: unknown): Book | null {
  if (!isRecord(rawDoc)) return null;

  const workKey = asString(rawDoc.key);
  if (!workKey) return null;

  const authorName = Array.isArray(rawDoc.author_name)
    ? rawDoc.author_name.find((name): name is string => typeof name === "string")
    : undefined;

  return {
    workKey,
    workId: toWorkId(workKey),
    title: asString(rawDoc.title) ?? "Sans titre",
    authorName,
    firstPublishYear: asNumber(rawDoc.first_publish_year),
    coverId: asNumber(rawDoc.cover_i),
  };
}

function parseSearchResponse(data: unknown): { books: Book[]; total: number } {
  if (!isRecord(data)) return { books: [], total: 0 };

  const docs = Array.isArray(data.docs) ? data.docs : [];
  const books = docs
    .map(parseSearchDoc)
    .filter((book): book is Book => book !== null);

  return { books, total: asNumber(data.numFound) ?? books.length };
}

function setSearchParam(url: URL, key: string, value?: string | number) {
  if (value === undefined) return;
  const text = String(value).trim();
  if (!text) return;
  url.searchParams.set(key, text);
}

export async function searchBooks(params: SearchBooksParams): Promise<{ books: Book[]; total: number }> {
  const {
    q,
    type = "title",
    title,
    author,
    first_publish_year,
    language,
    subject,
    page = 1,
    signal,
  } = params;

  const url = new URL(`${BASE}/search.json`);

  const quickQuery = q?.trim();
  if (quickQuery) {
    setSearchParam(url, type, quickQuery);
  } else {
    setSearchParam(url, "title", title);
    setSearchParam(url, "author", author);
    if (first_publish_year !== undefined) {
      setSearchParam(url, "first_publish_year", first_publish_year);
    }
    setSearchParam(url, "language", language);
    setSearchParam(url, "subject", subject);
  }

  if ([...url.searchParams.keys()].length === 0) {
    return { books: [], total: 0 };
  }

  url.searchParams.set("page", String(page));

  try {
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) {
      if (res.status === 404) return { books: [], total: 0 };
      throw new Error(`Open Library : HTTP ${res.status}`);
    }

    const data = (await res.json()) as unknown;
    return parseSearchResponse(data);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error(`Open Library : ${error instanceof Error ? error.message : "erreur reseau"}`);
  }
}

export function coverUrl(coverId?: number, size: "S" | "M" | "L" = "M") {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

function parseRecentChange(rawChange: unknown): RecentChange {
  if (!isRecord(rawChange)) {
    return {
      id: String(crypto.randomUUID?.() ?? Math.random()),
      kind: "modification",
      timestamp: "",
    };
  }

  const author =
    isRecord(rawChange.author) && asString(rawChange.author.key)
      ? asString(rawChange.author.key)
      : asString(rawChange.author);

  let link: string | undefined;
  if (Array.isArray(rawChange.changes) && rawChange.changes.length > 0) {
    const firstChange = rawChange.changes[0];
    if (isRecord(firstChange)) {
      const key = asString(firstChange.key);
      if (key) link = `https://openlibrary.org${key}`;
    }
  }

  return {
    id: String(rawChange.id ?? crypto.randomUUID?.() ?? Math.random()),
    kind: asString(rawChange.kind) ?? "modification",
    timestamp: asString(rawChange.timestamp) ?? "",
    comment: asString(rawChange.comment),
    author,
    link,
  };
}

function isDocumentRecentChange(change: RecentChange): boolean {
  const kind = change.kind.toLowerCase();
  if (kind.includes("book")) return true;
  return Boolean(change.link?.includes("/books/"));
}

export async function getRecentChanges(limit = 10, signal?: AbortSignal): Promise<RecentChange[]> {
  const fetchLimit = Math.min(Math.max(limit * 5, limit), 200);
  const url = `https://openlibrary.org/recentchanges.json?limit=${fetchLimit}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("Modifications recentes : erreur reseau");

  const data = (await res.json()) as unknown;
  if (!Array.isArray(data)) return [];
  return data.map(parseRecentChange).filter(isDocumentRecentChange).slice(0, limit);
}

function parseLanguages(rawLanguages: unknown): string[] | undefined {
  if (!Array.isArray(rawLanguages)) return undefined;

  const parsed = rawLanguages
    .map((language) => {
      if (typeof language === "string") return language;
      if (!isRecord(language)) return undefined;

      const key = asString(language.key);
      if (!key) return undefined;
      return key.split("/").pop() ?? key;
    })
    .filter((language): language is string => Boolean(language));

  return parsed.length > 0 ? parsed : undefined;
}

function parseStringArray(rawValue: unknown): string[] | undefined {
  if (!Array.isArray(rawValue)) return undefined;
  const parsed = rawValue.filter((value): value is string => typeof value === "string");
  return parsed.length > 0 ? parsed : undefined;
}

export async function getBookDetails(
  workId: string,
  signal?: AbortSignal,
): Promise<BookDetails | null> {
  const url = `${BASE}/works/${workId}.json`;

  async function getAuthorName(authorKey: string, currentSignal?: AbortSignal): Promise<string> {
    try {
      const authorUrl = `${BASE}${authorKey}.json`;
      const authorRes = await fetch(authorUrl, { signal: currentSignal });

      if (authorRes.status === 404) {
        return "Inconnu";
      }

      if (authorRes.ok) {
        const authorData = (await authorRes.json()) as unknown;
        return isRecord(authorData) ? asString(authorData.name) ?? "Inconnu" : "Inconnu";
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw error;
      }
    }

    return "Inconnu";
  }

  try {
    const res = await fetch(url, { signal });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Open Library : HTTP ${res.status}`);

    const data = (await res.json()) as unknown;
    if (!isRecord(data)) return null;

    let authors: Array<{ name: string; key?: string }> | undefined;

    if (Array.isArray(data.authors)) {
      const authorsPromises = data.authors.map(async (rawAuthor) => {
        if (!isRecord(rawAuthor)) return { name: "Inconnu" };

        const directName = asString(rawAuthor.name);
        const directKey = asString(rawAuthor.key);
        const nestedAuthor = isRecord(rawAuthor.author) ? rawAuthor.author : undefined;
        const nestedName = nestedAuthor ? asString(nestedAuthor.name) : undefined;
        const nestedKey = nestedAuthor ? asString(nestedAuthor.key) : undefined;

        if (directName) return { name: directName, key: directKey ?? nestedKey };
        if (nestedName) return { name: nestedName, key: nestedKey };

        if (nestedKey) {
          const authorName = await getAuthorName(nestedKey, signal);
          return { name: authorName, key: nestedKey };
        }

        if (directKey?.startsWith("/authors/")) {
          const authorName = await getAuthorName(directKey, signal);
          return { name: authorName, key: directKey };
        }

        return { name: "Inconnu" };
      });

      authors = await Promise.all(authorsPromises);
    } else if (Array.isArray(data.author_name)) {
      authors = data.author_name
        .filter((name): name is string => typeof name === "string")
        .map((name) => ({ name }));
    } else if (typeof data.author_name === "string") {
      authors = [{ name: data.author_name }];
    }

    let coverId: number | undefined;
    if (Array.isArray(data.covers)) {
      coverId = data.covers.find((cover): cover is number => typeof cover === "number");
    } else {
      coverId = asNumber(data.covers);
    }

    let description: string | undefined;
    if (typeof data.description === "string") {
      description = data.description;
    } else if (isRecord(data.description)) {
      description = asString(data.description.value);
    }

    const isbn = Array.isArray(data.isbn)
      ? data.isbn
          .map((value) => (typeof value === "string" || typeof value === "number" ? String(value) : undefined))
          .filter((value): value is string => Boolean(value))
      : undefined;

    return {
      workId,
      title: asString(data.title) ?? "Sans titre",
      authors,
      firstPublishYear: asNumber(data.first_publish_year),
      coverId,
      description,
      subjects: parseStringArray(data.subjects),
      languages: parseLanguages(data.languages),
      isbn: isbn && isbn.length > 0 ? isbn : undefined,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    return null;
  }
}
