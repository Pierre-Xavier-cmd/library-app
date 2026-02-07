import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBookDetails, coverUrl } from "../services/openLibrary";
import type { BookDetails } from "../services/openLibrary";
import { getWikipediaData } from "../services/wikipedia";
import type { WikipediaData } from "../services/wikipedia";

export function BookDetailPage() {
  const { workId } = useParams<{ workId: string }>();
  const [book, setBook] = useState<BookDetails | null>(null);
  const [wikipedia, setWikipedia] = useState<WikipediaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workId) {
      setError("No work ID provided");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Récupérer les détails du livre
        const bookData = await getBookDetails(workId, controller.signal);
        
        if (!bookData) {
          setError("Book not found");
          setLoading(false);
          return;
        }

        setBook(bookData);

        // Récupérer les données Wikipedia (chercher par titre)
        const wikiData = await getWikipediaData(bookData.title, controller.signal);
        setWikipedia(wikiData);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setError(e?.message ?? "Error loading book details");
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
    return <p>Loading book details…</p>;
  }

  if (error) {
    return (
      <section>
        <p data-error>❌ {error}</p>
      </section>
    );
  }

  if (!book) {
    return (
      <section>
        <p>Book not found.</p>
      </section>
    );
  }

  const coverImg = coverUrl(book.coverId, "L");

  return (
    <section>
      <header>
        <h1>{book.title}</h1>
      </header>

      <div style={{ display: "flex", gap: "2rem", marginTop: "2rem" }}>
        {coverImg && (
          <div>
            <img src={coverImg} alt={`Cover of ${book.title}`} style={{ maxWidth: "300px" }} />
          </div>
        )}

        <div>
          {book.authors && book.authors.length > 0 && (
            <div>
              <h2>Author(s)</h2>
              <ul>
                {book.authors.map((author, idx) => (
                  <li key={idx}>{author.name}</li>
                ))}
              </ul>
            </div>
          )}

          {book.firstPublishYear && (
            <div>
              <h2>First published</h2>
              <p>{book.firstPublishYear}</p>
            </div>
          )}

          {book.subjects && book.subjects.length > 0 && (
            <div>
              <h2>Subjects</h2>
              <ul>
                {book.subjects.slice(0, 10).map((subject, idx) => (
                  <li key={idx}>{subject}</li>
                ))}
              </ul>
            </div>
          )}

          {book.languages && book.languages.length > 0 && (
            <div>
              <h2>Languages</h2>
              <p>{book.languages.join(", ")}</p>
            </div>
          )}

          {book.description && (
            <div>
              <h2>Description</h2>
              <p>{book.description}</p>
            </div>
          )}
        </div>
      </div>

      {wikipedia && (
        <div style={{ marginTop: "3rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h2>Wikipedia Information</h2>
          
          {wikipedia.thumbnail && (
            <img 
              src={wikipedia.thumbnail} 
              alt={wikipedia.title}
              style={{ maxWidth: "200px", float: "right", marginLeft: "1rem" }}
            />
          )}
          
          <p>{wikipedia.extract}</p>
          
          <p>
            <a href={wikipedia.url} target="_blank" rel="noopener noreferrer">
              Read more on Wikipedia →
            </a>
          </p>
        </div>
      )}
    </section>
  );
}
