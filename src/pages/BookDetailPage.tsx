import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBookDetails, coverUrl } from "../services/openLibrary";
import type { BookDetails } from "../services/openLibrary";
import { getWikipediaData } from "../services/wikipedia";
import type { WikipediaData } from "../services/wikipedia";
import { getErrorMessage, isAbortError } from "../utils/errors";

export function BookDetailPage() {
  const { workId } = useParams<{ workId: string }>();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [wikipedia, setWikipedia] = useState<WikipediaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workId) {
      setError("Aucun identifiant d'ouvrage fourni.");
      setLoading(false);
      return;
    }
    const currentWorkId: string = workId;

    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Recuperer les details du livre.
        const bookData = await getBookDetails(currentWorkId, controller.signal);

        if (!bookData) {
          setError("Livre introuvable.");
          setLoading(false);
          return;
        }

        setBook(bookData);

        // Recuperer les donnees Wikipedia (recherche par titre).
        const wikiData = await getWikipediaData(bookData.title, controller.signal);
        setWikipedia(wikiData);
      } catch (error: unknown) {
        if (isAbortError(error)) return;
        setError(getErrorMessage(error, "Erreur lors du chargement des details du livre"));
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      controller.abort();
    };
  }, [workId]);

  if (loading) {
    return <p>Chargement des details du livre...</p>;
  }

  if (error) {
    return (
      <section>
        <p className="error-text">❌ {error}</p>
      </section>
    );
  }

  if (!book) {
    return (
      <section>
        <p>Livre introuvable.</p>
      </section>
    );
  }

  const coverImg = coverUrl(book.coverId, "L");

  return (
    <section>
      <header>
        <h1>{book.title}</h1>
      </header>

      <div className="grid book-detail-grid">
        {coverImg && (
          <div>
            <img src={coverImg} alt={`Couverture de ${book.title}`} className="book-detail-cover" />
          </div>
        )}

        <div>
          {book.authors && book.authors.length > 0 && (
            <section>
              <h2>Auteur(s)</h2>
              <ul>
                {book.authors.map((author, idx) => (
                  <li key={idx}>{author.name}</li>
                ))}
              </ul>
            </section>
          )}

          {book.firstPublishYear && (
            <section>
              <h2>Premiere publication</h2>
              <p>{book.firstPublishYear}</p>
            </section>
          )}

          {book.subjects && book.subjects.length > 0 && (
            <section>
              <h2>Sujets</h2>
              <ul>
                {book.subjects.slice(0, 10).map((subject, idx) => (
                  <li key={idx}>{subject}</li>
                ))}
              </ul>
            </section>
          )}

          {book.languages && book.languages.length > 0 && (
            <section>
              <h2>Langues</h2>
              <p>{book.languages.join(", ")}</p>
            </section>
          )}

          {book.description && (
            <section>
              <h2>Description</h2>
              <p>{book.description}</p>
            </section>
          )}
        </div>
      </div>

      {wikipedia && (
        <article>
          <h2>Informations Wikipedia</h2>
          <div className="grid wiki-grid">
            {wikipedia.thumbnail && (
              <img src={wikipedia.thumbnail} alt={wikipedia.title} className="wiki-thumb" />
            )}
            <p>{wikipedia.extract}</p>
          </div>
          <p>
            <a href={wikipedia.url} target="_blank" rel="noopener noreferrer">
              Lire la suite sur Wikipedia →
            </a>
          </p>
        </article>
      )}
    </section>
  );
}
