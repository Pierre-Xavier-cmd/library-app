import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Book, SearchType } from "../services/openLibrary";
import { coverUrl, quickSearchBooks } from "../services/openLibrary";
import { RecentChanges } from "../components/recent/RecentChanges";


export function HomePage() {
  const [sp] = useSearchParams();
  const q = sp.get("q") ?? "";
  const type = (sp.get("type") as SearchType) || "title";

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      const query = q.trim();
      if (!query) {
        setBooks([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const res = await quickSearchBooks({ q: query, type, page: 1 });
        if (!cancelled) setBooks(res.books);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [q, type]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        <RecentChanges limit={10} />
      {!q.trim() && <p>Type something in the search bar above to find books.</p>}


      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "crimson" }}>❌ {error}</p>}

      {!loading && !error && q.trim() && books.length === 0 && <p>No results.</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(1, minmax(0, 1fr))",
          gap: 12,
        }}
      >
        {books.map((b) => {
          const img = coverUrl(b.coverId, "M");
          return (
            <div
              key={b.workKey}
              style={{
                background: "white",
                border: "1px solid #eaeaea",
                borderRadius: 14,
                padding: 12,
                display: "flex",
                gap: 12,
              }}
            >
              <div style={{ width: 70, flex: "0 0 70px" }}>
                {img ? (
                  <img
                    src={img}
                    alt={`Cover of ${b.title}`}
                    style={{ width: 70, height: 100, objectFit: "cover", borderRadius: 10 }}
                  />
                ) : (
                  <div style={{ width: 70, height: 100, background: "#eee", borderRadius: 10 }} />
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>{b.title}</h3>
                <p style={{ margin: "6px 0 0", color: "#666" }}>{b.authorName ?? "Unknown author"}</p>
                {b.firstPublishYear && (
                  <p style={{ margin: "6px 0 0", color: "#666" }}>{b.firstPublishYear}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <style>
        {`
          @media (min-width: 640px) {
            div[style*="gridTemplateColumns: repeat(1"] { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
          @media (min-width: 980px) {
            div[style*="gridTemplateColumns: repeat(1"] { grid-template-columns: repeat(3, minmax(0, 1fr)); }
          }
        `}
      </style>
    </div>
  );
}
