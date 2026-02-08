import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import type { SearchType } from "../../services/openLibrary";

export function Header() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  // Initialise depuis l'URL (si on recharge la page).
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [type, setType] = useState<SearchType>((sp.get("type") as SearchType) || "title");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;

    // Redirige vers l'accueil avec paramètres (depuis n'importe quelle page).
    navigate(`/?q=${encodeURIComponent(query)}&type=${encodeURIComponent(type)}`);
  }

  return (
    <header className="container">
      <nav>
        <ul>
          <li>
            <strong>
              <Link to="/">Bibliotheque</Link>
            </strong>
          </li>
          <li>
            <Link to="/advanced-search">Recherche avancee</Link>
          </li>
        </ul>
      </nav>

      <form onSubmit={onSubmit} className="search-form">
        <fieldset role="group">
          <select
            value={type}
            onChange={(e) => setType(e.target.value as SearchType)}
            aria-label="Type de recherche"
          >
            <option value="title">Titre</option>
            <option value="author">Auteur</option>
          </select>

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={type === "title" ? "Rechercher par titre…" : "Rechercher par auteur…"}
            aria-label="Recherche"
          />

          <button type="submit">Rechercher</button>
        </fieldset>
      </form>
    </header>
  );
}
