export type ReadingStatus = "want" | "reading" | "read";

export type Book = {
  id: string;
  isbn: string;
  title: string;
  authors: string[];
  pageCount: number | null;
  publishedYear: string | null;
  publisher: string | null;
  coverUrl: string | null;
  description: string | null;
  status: ReadingStatus;
  currentPage: number;
  addedAt: string;
  updatedAt: string;
};

export type IsbnLookup = {
  isbn: string;
  title: string;
  authors: string[];
  pageCount: number | null;
  publishedYear: string | null;
  publisher: string | null;
  coverUrl: string | null;
  description: string | null;
};
