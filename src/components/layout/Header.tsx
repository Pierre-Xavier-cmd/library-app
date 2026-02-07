import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { SearchType } from "../../services/openLibrary";

export function Header() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  // initialise depuis l’URL (si on recharge la page)
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [type, setType] = useState<SearchType>((sp.get("type") as SearchType) || "title");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;

    // redirige vers Home avec paramètres (marche depuis n'importe quelle page)
    navigate(`/?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`);
  }

  return (
    <header style={{ padding: 16, borderBottom: "1px solid #e5e5e5", background: "white" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 12, alignItems: "center" }}>
        <Link to="/" style={{ fontWeight: 700, textDecoration: "none", color: "inherit" }}>
          📚 Library
        </Link>

        <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, flex: 1 }}>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SearchType)}
            aria-label="Search type"
            style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #ddd", background: "white" }}
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={type === "title" ? "Search by title…" : "Search by author…"}
            style={{
              flex: 1,
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #ddd",
              outline: "none",
            }}
          />

          <button
            type="submit"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #111",
              background: "#111",
              color: "white",
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>
      </div>
    </header>
  );
}
