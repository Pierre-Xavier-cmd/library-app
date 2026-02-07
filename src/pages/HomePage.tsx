import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { Book, SearchType } from "../services/openLibrary";
import { coverUrl, quickSearchBooks } from "../services/openLibrary";
import { RecentChanges } from "../components/recent/RecentChanges";

function BookCard({ book }: { book: Book }) {
  const img = coverUrl(book.coverId, "M");
  return (
    <article data-book-card>
      <div>
        {img ? (
          <img src={img} alt={`Cover of ${book.title}`} />
        ) : (
          <div data-cover-placeholder />
        )}
      </div>

      <div>
        <h3>
          <Link to={`/book/${book.workId}`}>{book.title}</Link>
        </h3>
        <p>{book.authorName ?? "Unknown author"}</p>
        {book.firstPublishYear && <p>{book.firstPublishYear}</p>}
      </div>
    </article>
  );
}

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
        const res = await quickSearchBooks({
          q: query,
          type,
          page: 1,
          signal: controller.signal,
        });
        setBooks(res.books);
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
  }, [q, type]);

  return (
    <>
      <RecentChanges limit={10} />
      {!q.trim() && <p>Type something in the search bar above to find books.</p>}

      {loading && <p>Loading…</p>}
      {error && <p data-error>❌ {error}</p>}

      {!loading && !error && q.trim() && books.length === 0 && <p>No results.</p>}

      <section data-books-grid>
        {books.map((book) => (
          <BookCard key={book.workKey} book={book} />
        ))}
      </section>
    </>
  );
}
