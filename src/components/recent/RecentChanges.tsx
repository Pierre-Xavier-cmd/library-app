import { useEffect, useState } from "react";
import { getRecentChanges, type RecentChange } from "../../services/openLibrary";
import { getErrorMessage, isAbortError } from "../../utils/errors";

function formatKind(kind: string): string {
  const normalized = kind.toLowerCase();
  if (normalized === "add-book") return "Ajout de livre";
  if (normalized === "edit-book") return "Modification de livre";
  if (normalized === "new-book") return "Nouveau livre";
  if (normalized === "update") return "Mise a jour";
  return kind;
}

function formatComment(comment?: string): string | null {
  if (!comment) return null;
  const text = comment.trim();
  if (!text) return null;

  const normalized = text.toLowerCase();
  if (normalized.includes("machine_comment") || normalized.includes("source_records")) {
    return null;
  }
  if (normalized === "import existing book") return "Import d'un livre existant";
  if (normalized === "import new book") return "Import d'un nouveau livre";
  return text;
}

export function RecentChanges({ limit = 5 }: { limit?: number }) {
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
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setError(getErrorMessage(error, "Erreur"));
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
    <article>
      <header>
        <h2>Modifications recentes</h2>
        <small>Source : Open Library</small>
      </header>

      {loading && <p>Chargement…</p>}
      {error && <p className="error-text">❌ {error}</p>}

      {!loading && !error && (
        <ul>
          {items.map((it) => {
            const comment = formatComment(it.comment);

            return (
              <li key={it.id}>
                <strong>{formatKind(it.kind)}</strong>{" "}
                <span>
                  — {it.timestamp ? new Date(it.timestamp).toLocaleString() : "date inconnue"}
                </span>
                {comment ? <div>{comment}</div> : null}
                {it.link ? (
                  <a href={it.link} target="_blank" rel="noreferrer">
                    Voir sur Open Library
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
