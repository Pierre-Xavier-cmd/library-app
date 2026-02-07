export type WikipediaData = {
  title: string;
  extract: string; // description courte
  url: string; // lien vers la page Wikipedia
  thumbnail?: string; // image si disponible
};

export async function getWikipediaData(
  searchTerm: string,
  signal?: AbortSignal
): Promise<WikipediaData | null> {
  // API Wikipedia REST
  const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`;
  
  try {
    const res = await fetch(searchUrl, { signal });
    
    if (!res.ok || res.status === 404) {
      return null;
    }
    
    const data = await res.json();
    
    return {
      title: data.title ?? searchTerm,
      extract: data.extract ?? "",
      url: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm)}`,
      thumbnail: data.thumbnail?.source,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }
    return null;
  }
}

