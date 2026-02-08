import { useState } from "react";
import type { FormEvent } from "react";
import type { Book, SearchBooksParams } from "../services/openLibrary";
import { searchBooks } from "../services/openLibrary";
import { BookCard } from "../components/books/BookCard";
import { getErrorMessage } from "../utils/errors";

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

    // Verifier qu'au moins un champ est rempli.
    if (!title.trim() && !author.trim() && !year.trim() && !subject.trim() && !language.trim()) {
      setError("Veuillez remplir au moins un champ.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: SearchBooksParams = {};
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

      // Verifier qu'on a au moins un parametre valide.
      if (Object.keys(params).length === 0) {
        setError("Veuillez fournir au moins un critere de recherche valide.");
        setLoading(false);
        return;
      }

      const res = await searchBooks(params);
      setBooks(res.books);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Erreur pendant la recherche"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <header>
        <h1>Recherche avancee</h1>
        <p>Construisez des requetes precises (auteur, date, mots-cles, langue...).</p>
      </header>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Titre</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du livre"
          />
        </div>

        <div>
          <label htmlFor="author">Auteur</label>
          <input
            id="author"
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Nom de l'auteur"
          />
        </div>

        <div>
          <label htmlFor="year">Annee de premiere publication</label>
          <input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Ex. 1984"
            min="1000"
            max={new Date().getFullYear()}
          />
        </div>

        <div>
          <label htmlFor="subject">Sujet / Tags</label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex. fiction, science"
          />
        </div>

        <div>
          <label htmlFor="language">Langue</label>
          <input
            id="language"
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            placeholder="Ex. eng, fra"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Recherche..." : "Rechercher"}
        </button>
      </form>

      {error && <p className="error-text">❌ {error}</p>}

      {!loading && !error && books.length === 0 && title === "" && author === "" && year === "" && subject === "" && language === "" && (
        <p>Remplissez au moins un champ pour lancer la recherche.</p>
      )}

      {!loading && !error && books.length === 0 && (title !== "" || author !== "" || year !== "" || subject !== "" || language !== "") && (
        <p>Aucun resultat trouve.</p>
      )}

      <section className="book-list">
        {books.map((book) => (
          <BookCard key={book.workKey} book={book} />
        ))}
      </section>
    </section>
  );
}
