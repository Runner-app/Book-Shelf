import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Book } from "./types";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "library.json");

async function readLibrary(): Promise<Book[]> {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw) as Book[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeLibrary(books: Book[]) {
  await mkdir(dataDir, { recursive: true });
  const tmp = `${dataFile}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(books, null, 2), "utf8");
  try {
    await rename(tmp, dataFile);
  } catch {
    await unlink(dataFile).catch(() => undefined);
    await rename(tmp, dataFile);
  }
}

export async function listBooks(): Promise<Book[]> {
  const books = await readLibrary();
  return books.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getBook(id: string): Promise<Book | null> {
  const books = await readLibrary();
  return books.find((book) => book.id === id) ?? null;
}

export async function saveBook(book: Book): Promise<Book> {
  const books = await readLibrary();
  const index = books.findIndex((item) => item.id === book.id);
  if (index === -1) {
    books.push(book);
  } else {
    books[index] = book;
  }
  await writeLibrary(books);
  return book;
}

export async function findByIsbn(isbn: string): Promise<Book | null> {
  const books = await readLibrary();
  return books.find((book) => book.isbn === isbn) ?? null;
}

export async function deleteBook(id: string): Promise<boolean> {
  const books = await readLibrary();
  const next = books.filter((book) => book.id !== id);
  if (next.length === books.length) return false;
  await writeLibrary(next);
  return true;
}
