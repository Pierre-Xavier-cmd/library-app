import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Book, SearchType } from "../services/openLibrary";
import { searchBooks } from "../services/openLibrary";
import { RecentChanges } from "../components/recent/RecentChanges";
import { BookCard } from "../components/books/BookCard";
import { getErrorMessage, isAbortError } from "../utils/errors";

export function HomePage() {
  const [sp] = useSearchParams();
  const q = sp.get("q") ?? "";
  const type = (sp.get("type") as SearchType) || "title";

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

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
        const res = await searchBooks({
          q: query,
          type,
          page: 1,
          signal: controller.signal,
        });
        setBooks(res.books);
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
  }, [q, type]);

  return (
    <>
      {!q.trim() && <p>Saisissez une recherche dans la barre ci-dessus pour trouver des livres.</p>}

      {loading && <p>Chargement…</p>}
      {error && <p className="error-text">❌ {error}</p>}

      {!loading && !error && q.trim() && books.length === 0 && <p>Aucun resultat.</p>}

      <section className="book-list">
        {books.map((book) => (
          <BookCard key={book.workKey} book={book} />
        ))}
      </section>

      <RecentChanges limit={5} />
    </>
  );
}
