import { useEffect, useState } from "react";
import { getRecentChanges, type RecentChange } from "../../services/openLibrary";

export function RecentChanges({ limit = 10 }: { limit?: number }) {
  const [items, setItems] = useState<RecentChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getRecentChanges(limit, controller.signal);
        setItems(data);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Error");
      } finally {
        setLoading(false);
      }
    }

    run();
    return () => {
      controller.abort();
    };
  }, [limit]);

  return (
    <article data-panel>
      <header data-panel-header>
        <h2>Recent changes</h2>
        <small>Source: Open Library</small>
      </header>

      {loading && <p>Loading…</p>}
      {error && <p data-error>❌ {error}</p>}

      {!loading && !error && (
        <ul data-list>
          {items.map((it) => (
            <li key={it.id}>
              <strong>{it.kind}</strong>{" "}
              <span>
                — {it.timestamp ? new Date(it.timestamp).toLocaleString() : "unknown date"}
              </span>
              {it.comment ? <div>{it.comment}</div> : null}
              {it.link ? (
                <a href={it.link} target="_blank" rel="noreferrer">
                  View on Open Library
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
