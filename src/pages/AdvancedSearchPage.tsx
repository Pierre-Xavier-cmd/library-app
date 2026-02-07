import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import type { Book, AdvancedSearchParams } from "../services/openLibrary";
import { advancedSearchBooks, coverUrl } from "../services/openLibrary";

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

export function AdvancedSearchPage() {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [year, setYear] = useState("");
  const [subject, setSubject] = useState("");
  const [language, setLanguage] = useState("");
  
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    
    // Vérifier qu'au moins un champ est rempli
    if (!title.trim() && !author.trim() && !year.trim() && !subject.trim() && !language.trim()) {
      setError("Please fill in at least one field");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const params: AdvancedSearchParams = {};
      if (title.trim()) params.title = title.trim();
      if (author.trim()) params.author = author.trim();
      if (year.trim()) {
        const yearNum = parseInt(year, 10);
        if (!isNaN(yearNum) && yearNum > 0) {
          params.first_publish_year = yearNum;
        }
      }
      if (subject.trim()) params.subject = subject.trim();
      if (language.trim()) params.language = language.trim();
      
      // Vérifier qu'on a au moins un paramètre valide
      if (Object.keys(params).length === 0) {
        setError("Please provide at least one valid search criteria");
        setLoading(false);
        return;
      }
      
      const res = await advancedSearchBooks(params);
      setBooks(res.books);
    } catch (e: any) {
      setError(e?.message ?? "Error during search");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <header>
        <h1>Advanced search</h1>
        <p>Build precise queries (author, date, tags, language…).</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Book title"
          />
        </div>

        <div>
          <label htmlFor="author">Author</label>
          <input
            id="author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Author name"
          />
        </div>

        <div>
          <label htmlFor="year">First publish year</label>
          <input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 1984"
            min="1000"
            max="2026"
          />
        </div>

        <div>
          <label htmlFor="subject">Subject / Tags</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. fiction, science"
          />
        </div>

        <div>
          <label htmlFor="language">Language</label>
          <input
            id="language"
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="e.g. eng, fra"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p data-error>❌ {error}</p>}

      {!loading && !error && books.length === 0 && title === "" && author === "" && year === "" && subject === "" && language === "" && (
        <p>Fill in at least one field to search.</p>
      )}

      {!loading && !error && books.length === 0 && (title !== "" || author !== "" || year !== "" || subject !== "" || language !== "") && (
        <p>No results found.</p>
      )}

      <section data-books-grid>
        {books.map((book) => (
          <BookCard key={book.workKey} book={book} />
        ))}
      </section>
    </section>
  );
}
