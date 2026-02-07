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
  signal?: AbortSignal;
}): Promise<{ books: Book[]; total: number }> {
  const { q, type, page = 1, signal } = params;
  const query = q.trim();
  if (!query) return { books: [], total: 0 };

  const url = new URL(`${BASE}/search.json`);
  url.searchParams.set(type, query);
  url.searchParams.set("page", String(page));

  try {
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) {
      // Gérer les erreurs HTTP de manière plus informative
      if (res.status === 404) {
        return { books: [], total: 0 }; // Pas de résultats
      }
      throw new Error(`Open Library: HTTP ${res.status}`);
    }
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
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error; // Re-lancer AbortError
    }
    throw new Error(`Open Library: ${error instanceof Error ? error.message : "network error"}`);
  }
}

export function coverUrl(coverId?: number, size: "S" | "M" | "L" = "M") {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}

export type RecentChange = {
  id: string;
  kind: string; // ex: "edit", "new", etc.
  timestamp: string; // ISO
  comment?: string;
  author?: string;
  link?: string; // lien vers openlibrary.org
};

export async function getRecentChanges(
  limit = 10,
  signal?: AbortSignal,
): Promise<RecentChange[]> {
  const url = `https://openlibrary.org/recentchanges.json?limit=${limit}`;
  const res = await fetch(url, { signal });
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

// Type pour les paramètres de recherche avancée
export type AdvancedSearchParams = {
  title?: string;
  author?: string;
  first_publish_year?: number;
  language?: string;
  subject?: string; // tags
  page?: number;
  signal?: AbortSignal;
};

// Fonction de recherche avancée
export async function advancedSearchBooks(
  params: AdvancedSearchParams
): Promise<{ books: Book[]; total: number }> {
  const { page = 1, signal, ...searchParams } = params;

  const url = new URL(`${BASE}/search.json`);
  
  // Ajouter seulement les paramètres non vides
  // L'API Open Library accepte ces paramètres directement
  if (searchParams.title) {
    url.searchParams.set("title", searchParams.title);
  }
  if (searchParams.author) {
    url.searchParams.set("author", searchParams.author);
  }
  if (searchParams.first_publish_year !== undefined) {
    url.searchParams.set("first_publish_year", String(searchParams.first_publish_year));
  }
  if (searchParams.language) {
    url.searchParams.set("language", searchParams.language);
  }
  if (searchParams.subject) {
    url.searchParams.set("subject", searchParams.subject);
  }
  
  url.searchParams.set("page", String(page));

  try {
    const res = await fetch(url.toString(), { signal });
    if (!res.ok) {
      // Gérer les erreurs HTTP de manière plus informative
      if (res.status === 404) {
        return { books: [], total: 0 }; // Pas de résultats
      }
      throw new Error(`Open Library: HTTP ${res.status}`);
    }
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
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error; // Re-lancer AbortError
    }
    throw new Error(`Open Library: ${error instanceof Error ? error.message : "network error"}`);
  }
}

// Type pour les détails complets d'un livre
export type BookDetails = {
  workId: string;
  title: string;
  authors?: Array<{ name: string; key?: string }>;
  firstPublishYear?: number;
  coverId?: number;
  description?: string;
  subjects?: string[];
  languages?: string[];
  isbn?: string[];
};

// Fonction pour récupérer les détails d'un livre
export async function getBookDetails(
  workId: string,
  signal?: AbortSignal
): Promise<BookDetails | null> {
  const url = `${BASE}/works/${workId}.json`;
  
  try {
    const res = await fetch(url, { signal });
    
    // Gérer les 404 silencieusement
    if (res.status === 404) {
      return null;
    }
    
    if (!res.ok) {
      throw new Error(`Open Library: HTTP ${res.status}`);
    }
    
    const data = await res.json();
  
    // Fonction helper pour récupérer le nom d'un auteur
  async function getAuthorName(authorKey: string, signal?: AbortSignal): Promise<string> {
    try {
      const authorUrl = `${BASE}${authorKey}.json`;
      const authorRes = await fetch(authorUrl, { signal });
      
      // Gérer les 404 silencieusement
      if (authorRes.status === 404) {
        return "Unknown";
      }
      
      if (authorRes.ok) {
        const authorData = await authorRes.json();
        return authorData.name ?? "Unknown";
      }
    } catch (error) {
      // Ignore les erreurs réseau et AbortError
      if (error instanceof Error && error.name === "AbortError") {
        throw error; // Re-lancer AbortError pour qu'il soit géré en haut
      }
      // Ignore les autres erreurs silencieusement
    }
    return "Unknown";
  }
  
  // Gérer les auteurs dans différents formats
  let authors: Array<{ name: string; key?: string }> | undefined;
  
  if (data.authors && Array.isArray(data.authors)) {
    // Récupérer les noms des auteurs (peut nécessiter des appels API supplémentaires)
    const authorsPromises = data.authors.map(async (a: any) => {
      // Priorité 1: utiliser le nom directement si disponible (plusieurs formats possibles)
      if (a.name) {
        return { name: a.name, key: a.key || a.author?.key };
      }
      if (a.author?.name) {
        return { name: a.author.name, key: a.author.key };
      }
      
      // Priorité 2: si on a une clé d'auteur, récupérer le nom via API
      if (a.author?.key) {
        const authorKey = a.author.key;
        const authorName = await getAuthorName(authorKey, signal);
        return { name: authorName, key: authorKey };
      }
      
      // Priorité 3: si on a juste une clé directe
      if (a.key && a.key.startsWith("/authors/")) {
        const authorName = await getAuthorName(a.key, signal);
        return { name: authorName, key: a.key };
      }
      
      return { name: "Unknown" };
    });
    
    authors = await Promise.all(authorsPromises);
  } else if (data.author_name && Array.isArray(data.author_name)) {
    authors = data.author_name.map((name: string) => ({ name }));
  } else if (data.author_name && typeof data.author_name === "string") {
    authors = [{ name: data.author_name }];
  }
  
  return {
    workId,
    title: data.title ?? "Untitled",
    authors,
    firstPublishYear: data.first_publish_year,
    coverId: data.covers?.[0] ?? data.covers,
    description: typeof data.description === "string" 
      ? data.description 
      : data.description?.value,
    subjects: data.subjects,
    languages: data.languages,
    isbn: data.isbn,
  };
  } catch (error) {
    // Gérer les erreurs réseau
    if (error instanceof Error && error.name === "AbortError") {
      throw error; // Re-lancer AbortError
    }
    // Pour les autres erreurs (réseau, parsing, etc.), retourner null
    return null;
  }
}
  
