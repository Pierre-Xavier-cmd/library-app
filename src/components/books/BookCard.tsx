import { Link } from "react-router-dom";
import type { Book } from "../../services/openLibrary";
import { coverUrl } from "../../services/openLibrary";

export function BookCard({ book }: { book: Book }) {
  const img = coverUrl(book.coverId, "M");

  return (
    <article className="book-card">
      <div>
        {img ? (
          <img src={img} alt={`Couverture de ${book.title}`} className="book-cover" />
        ) : (
          <div className="book-cover-placeholder" />
        )}
      </div>

      <div>
        <h3>
          <Link to={`/book/${book.workId}`}>{book.title}</Link>
        </h3>
        <p>{book.authorName ?? "Auteur inconnu"}</p>
        {book.firstPublishYear && <p>{book.firstPublishYear}</p>}
      </div>
    </article>
  );
}
