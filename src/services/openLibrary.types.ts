export type SearchType = "title" | "author";

export type Book = {
  workKey: string;
  workId: string;
  title: string;
  authorName?: string;
  firstPublishYear?: number;
  coverId?: number;
};

export type SearchBooksParams = {
  q?: string;
  type?: SearchType;
  title?: string;
  author?: string;
  first_publish_year?: number;
  language?: string;
  subject?: string;
  page?: number;
  signal?: AbortSignal;
};

export type RecentChange = {
  id: string;
  kind: string;
  timestamp: string;
  comment?: string;
  author?: string;
  link?: string;
};

export type BookDetails = {
  workId: string;
  title: string;
  authors?: Array<{ name: string; key?: string }>;
  firstPublishYear?: number;
  coverId?: number;
  description?: string;
  subjects?: string[];
  languages?: string[];
  isbn?: string[];
};
