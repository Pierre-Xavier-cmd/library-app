import { useEffect, useState } from "react";
import { getRecentChanges, type RecentChange } from "../../services/openLibrary";

export function RecentChanges({ limit = 10 }: { limit?: number }) {
  const [items, setItems] = useState<RecentChange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const data = await getRecentChanges(limit);
        if (!cancelled) setItems(data);
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
  }, [limit]);

  return (
    <section
      style={{
        background: "white",
        border: "1px solid #eaeaea",
        borderRadius: 14,
        padding: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Recent changes</h2>
        <small style={{ color: "#666" }}>Source: Open Library</small>
      </div>

      {loading && <p style={{ marginTop: 10 }}>Loading…</p>}
      {error && <p style={{ marginTop: 10, color: "crimson" }}>❌ {error}</p>}

      {!loading && !error && (
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, display: "grid", gap: 8 }}>
          {items.map((it) => (
            <li key={it.id} style={{ lineHeight: 1.3 }}>
              <span style={{ fontWeight: 600 }}>{it.kind}</span>{" "}
              <span style={{ color: "#666" }}>
                — {it.timestamp ? new Date(it.timestamp).toLocaleString() : "unknown date"}
              </span>
              {it.comment ? <div style={{ color: "#333" }}>{it.comment}</div> : null}
              {it.link ? (
                <a href={it.link} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
                  View on Open Library
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
