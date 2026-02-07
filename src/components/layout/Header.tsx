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
    <header data-site-header>
      <nav data-container data-header>
        <div data-nav-links>
          <Link to="/" data-brand>
            Library
          </Link>
          <Link to="/advanced-search">Advanced search</Link>
        </div>

        <form onSubmit={onSubmit} data-search-form>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SearchType)}
            aria-label="Search type"
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={type === "title" ? "Search by title…" : "Search by author…"}
            aria-label="Search"
          />

          <button type="submit">Search</button>
        </form>
      </nav>
    </header>
  );
}
