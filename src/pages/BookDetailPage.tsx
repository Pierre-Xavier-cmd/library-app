import { useParams } from "react-router-dom";

export function BookDetailPage() {
  const { workId } = useParams();

  return (
    <section>
      <header>
        <h1>Book detail</h1>
        <p>Page for a specific work.</p>
      </header>

      <p>
        Selected work: <strong>{workId ?? "unknown"}</strong>
      </p>

      <p>Coming soon. This page will show book metadata and Wikipedia data.</p>
    </section>
  );
}
