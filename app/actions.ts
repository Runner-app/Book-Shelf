"use server";

import { revalidatePath } from "next/cache";
import { lookupIsbn as fetchIsbn } from "@/lib/isbn";
import { deleteBook, findByIsbn, getBook, saveBook } from "@/lib/store";
import type { Book, IsbnLookup, ReadingStatus } from "@/lib/types";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function clampPage(page: number, pageCount: number | null): number {
  if (!Number.isFinite(page) || page < 0) return 0;
  if (pageCount == null) return Math.floor(page);
  return Math.min(Math.floor(page), pageCount);
}

function statusFromProgress(
  currentPage: number,
  pageCount: number | null,
): ReadingStatus {
  if (pageCount && currentPage >= pageCount) return "read";
  if (currentPage > 0) return "reading";
  return "want";
}

export async function previewIsbn(raw: string): Promise<ActionResult<IsbnLookup>> {
  try {
    const data = await fetchIsbn(raw);
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Nie udało się pobrać ISBN.",
    };
  }
}

export async function addBookFromIsbn(raw: string): Promise<ActionResult<Book>> {
  try {
    const lookup = await fetchIsbn(raw);
    const existing = await findByIsbn(lookup.isbn);
    if (existing) {
      return { ok: false, error: "Ta książka jest już na półce." };
    }

    const now = new Date().toISOString();
    const book: Book = {
      id: crypto.randomUUID(),
      isbn: lookup.isbn,
      title: lookup.title,
      authors: lookup.authors,
      pageCount: lookup.pageCount,
      publishedYear: lookup.publishedYear,
      publisher: lookup.publisher,
      coverUrl: lookup.coverUrl,
      description: lookup.description,
      status: "want",
      currentPage: 0,
      addedAt: now,
      updatedAt: now,
    };

    await saveBook(book);
    revalidatePath("/");
    revalidatePath(`/books/${book.id}`);
    return { ok: true, data: book };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Nie udało się dodać książki.",
    };
  }
}

export async function updateReading(
  id: string,
  patch: { currentPage?: number; status?: ReadingStatus },
): Promise<ActionResult<Book>> {
  const book = await getBook(id);
  if (!book) return { ok: false, error: "Nie znaleziono książki." };

  let currentPage =
    patch.currentPage === undefined
      ? book.currentPage
      : clampPage(patch.currentPage, book.pageCount);
  let status = patch.status ?? book.status;
  let finishedAt = book.finishedAt;

  if (patch.status === "want") {
    currentPage = 0;
    status = "want";
    finishedAt = null;
  } else if (patch.status === "read") {
    status = "read";
    if (book.pageCount) currentPage = book.pageCount;
    finishedAt = finishedAt ?? new Date().toISOString();
  } else if (patch.status === "reading") {
    status = "reading";
    if (currentPage === 0) currentPage = 1;
    finishedAt = null;
  } else if (patch.currentPage !== undefined) {
    const next = statusFromProgress(currentPage, book.pageCount);
    // Jeśli z postępu wychodzi "read", ustaw finishedAt
    if (next === "read" && status !== "read") {
      finishedAt = finishedAt ?? new Date().toISOString();
    } else if (next !== "read") {
      finishedAt = null;
    }
    status = next;
  }

  const next: Book = {
    ...book,
    currentPage,
    status,
    finishedAt,
    updatedAt: new Date().toISOString(),
  };

  await saveBook(next);
  revalidatePath("/");
  revalidatePath(`/books/${book.id}`);
  return { ok: true, data: next };
}

export async function removeBook(id: string): Promise<ActionResult<{ id: string }>> {
  const removed = await deleteBook(id);
  if (!removed) return { ok: false, error: "Nie znaleziono książki." };
  revalidatePath("/");
  return { ok: true, data: { id } };
}

export type ManualBookInput = {
  title: string;
  authors: string;
  pageCount?: string;
  publishedYear?: string;
  publisher?: string;
  coverUrl?: string;
  description?: string;
};

export async function addBookManual(
  input: ManualBookInput,
): Promise<ActionResult<Book>> {
  const title = input.title?.trim();
  if (!title) {
    return { ok: false, error: "Tytuł jest wymagany." };
  }

  const authors = (input.authors ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  const pageCountRaw = Number.parseInt(input.pageCount ?? "", 10);
  const pageCount = Number.isFinite(pageCountRaw) && pageCountRaw > 0
    ? pageCountRaw
    : null;

  const yearMatch = (input.publishedYear ?? "").match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  const publishedYear = yearMatch?.[1] ?? null;

  const now = new Date().toISOString();
  const book: Book = {
    id: crypto.randomUUID(),
    isbn: `manual:${crypto.randomUUID()}`,
    title,
    authors,
    pageCount,
    publishedYear,
    publisher: input.publisher?.trim() || null,
    coverUrl: input.coverUrl?.trim() || null,
    description: input.description?.trim() || null,
    status: "want",
    currentPage: 0,
    addedAt: now,
    updatedAt: now,
    finishedAt: null,
  };

  try {
    await saveBook(book);
    revalidatePath("/");
    revalidatePath(`/books/${book.id}`);
    return { ok: true, data: book };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Nie udało się dodać książki.",
    };
  }
}

export type BookEditInput = {
  title: string;
  authors: string;
  pageCount?: string;
  publishedYear?: string;
  publisher?: string;
  coverUrl?: string;
  description?: string;
  finishedAt?: string;
};

export async function updateBook(
  id: string,
  input: BookEditInput,
): Promise<ActionResult<Book>> {
  const existing = await getBook(id);
  if (!existing) return { ok: false, error: "Nie znaleziono książki." };

  const title = input.title?.trim();
  if (!title) return { ok: false, error: "Tytuł jest wymagany." };

  const authors = (input.authors ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  const pageCountRaw = Number.parseInt(input.pageCount ?? "", 10);
  const pageCount = Number.isFinite(pageCountRaw) && pageCountRaw > 0
    ? pageCountRaw
    : null;

  const yearMatch = (input.publishedYear ?? "").match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  const publishedYear = yearMatch?.[1] ?? null;

  // Dopasuj currentPage, jeśli zmieniła się liczba stron
  let currentPage = existing.currentPage;
  if (pageCount != null && currentPage > pageCount) currentPage = pageCount;
  if (pageCount == null) currentPage = 0;

  let finishedAt: string | null = existing.finishedAt;
  if (input.finishedAt !== undefined) {
    const raw = input.finishedAt.trim();
    finishedAt = raw ? new Date(`${raw}T12:00:00`).toISOString() : null;
  }

  const next: Book = {
    ...existing,
    title,
    authors,
    pageCount,
    publishedYear,
    publisher: input.publisher?.trim() || null,
    coverUrl: input.coverUrl?.trim() || null,
    description: input.description?.trim() || null,
    currentPage,
    updatedAt: new Date().toISOString(),
    finishedAt,
  };

  try {
    await saveBook(next);
    revalidatePath("/");
    revalidatePath(`/books/${id}`);
    return { ok: true, data: next };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Nie udało się zapisać zmian.",
    };
  }
}
