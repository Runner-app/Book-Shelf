import type { IsbnLookup } from "./types";

const UA = "Shelf/0.1 (personal book tracker)";

export function normalizeIsbn(raw: string): string | null {
  const digits = raw.replace(/[^0-9Xx]/g, "").toUpperCase();
  if (digits.length === 10 || digits.length === 13) {
    return digits;
  }
  return null;
}

function yearFromDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(/\b(1[0-9]{3}|20[0-9]{2})\b/);
  return match?.[1] ?? null;
}

function textField(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (
    value &&
    typeof value === "object" &&
    "value" in value &&
    typeof (value as { value: unknown }).value === "string"
  ) {
    return (value as { value: string }).value.trim();
  }
  return null;
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA },
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function lookupOpenLibrary(isbn: string): Promise<IsbnLookup | null> {
  const edition = (await fetchJson(
    `https://openlibrary.org/isbn/${isbn}.json`,
  )) as
    | {
        title?: string;
        authors?: { key?: string }[];
        number_of_pages?: number;
        pagination?: string;
        publish_date?: string;
        publishers?: string[];
        covers?: number[];
        works?: { key?: string }[];
        notes?: unknown;
        description?: unknown;
      }
    | null;

  if (!edition?.title) return null;

  const authorNames = await Promise.all(
    (edition.authors ?? []).slice(0, 4).map(async (ref) => {
      if (!ref.key) return null;
      const author = (await fetchJson(`https://openlibrary.org${ref.key}.json`)) as
        | { name?: string }
        | null;
      return author?.name ?? null;
    }),
  );

  let description =
    textField(edition.description) ?? textField(edition.notes);
  const workKey = edition.works?.[0]?.key;
  if (!description && workKey) {
    const work = (await fetchJson(`https://openlibrary.org${workKey}.json`)) as
      | { description?: unknown }
      | null;
    description = textField(work?.description);
  }

  const coverId = edition.covers?.find((id) => id > 0);
  const coverUrl = coverId
    ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
    : `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;

  const pagesFromPagination = edition.pagination
    ? Number.parseInt(edition.pagination, 10)
    : NaN;

  return {
    isbn,
    title: edition.title,
    authors: authorNames.filter((name): name is string => Boolean(name)),
    pageCount:
      edition.number_of_pages ??
      (Number.isFinite(pagesFromPagination) ? pagesFromPagination : null),
    publishedYear: yearFromDate(edition.publish_date),
    publisher: edition.publishers?.[0] ?? null,
    coverUrl,
    description,
  };
}

async function lookupGoogleBooks(isbn: string): Promise<IsbnLookup | null> {
  const json = (await fetchJson(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`,
  )) as {
    items?: {
      volumeInfo?: {
        title?: string;
        authors?: string[];
        pageCount?: number;
        publishedDate?: string;
        publisher?: string;
        description?: string;
        imageLinks?: { thumbnail?: string; smallThumbnail?: string };
      };
    }[];
  } | null;

  const info = json?.items?.[0]?.volumeInfo;
  if (!info?.title) return null;

  const rawCover =
    info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null;

  return {
    isbn,
    title: info.title,
    authors: info.authors ?? [],
    pageCount: info.pageCount ?? null,
    publishedYear: yearFromDate(info.publishedDate),
    publisher: info.publisher ?? null,
    coverUrl: rawCover ? rawCover.replace("http://", "https://") : null,
    description: info.description ?? null,
  };
}

type MarcField = {
  tag?: string;
  subfields?: { code?: string; value?: string }[];
};

async function lookupNationalLibrary(isbn: string): Promise<IsbnLookup | null> {
  const json = (await fetchJson(
    `https://data.bn.org.pl/api/networks/bibs.json?query=isbn:${isbn}&limit=1`,
  )) as
    | {
        bibs?: { marc?: { fields?: MarcField[] } }[];
      }
    | null;

  const fields = json?.bibs?.[0]?.marc?.fields;
  if (!fields) return null;

  function getSubfield(tag: string, code: string): string | null {
    for (const field of fields!) {
      if (field.tag === tag) {
        const sub = field.subfields?.find((s) => s.code === code);
        if (sub?.value) {
          return sub.value.replace(/\s*[\/:;=]\s*$/, "").trim();
        }
      }
    }
    return null;
  }

  const title = getSubfield("245", "a");
  if (!title) return null;

  const author = getSubfield("100", "a") || getSubfield("700", "a");

  // Pole 300 $a ma format typu "600 s. : il. ; 21 cm"
  const extent = getSubfield("300", "a");
  const pageCount = extent ? Number.parseInt(extent, 10) || null : null;

  // Rok: 260 $c (starsze) lub 264 $c (nowsze)
  const yearRaw = getSubfield("260", "c") || getSubfield("264", "c");
  const publishedYear =
    yearRaw?.match(/\b(1[0-9]{3}|20[0-9]{2})\b/)?.[1] ?? null;

  return {
    isbn,
    title,
    authors: author ? [author] : [],
    pageCount,
    publishedYear,
    publisher: getSubfield("260", "b") || getSubfield("264", "b"),
    coverUrl: null, // BN nie udostępnia okładek
    description: null, // BN nie udostępnia opisów
  };
}

function mergeLookups(
  primary: IsbnLookup | null,
  fallback: IsbnLookup | null,
): IsbnLookup | null {
  if (!primary && !fallback) return null;
  if (!primary) return fallback;
  if (!fallback) return primary;

  return {
    isbn: primary.isbn,
    title: primary.title || fallback.title,
    authors: primary.authors.length ? primary.authors : fallback.authors,
    pageCount: primary.pageCount ?? fallback.pageCount,
    publishedYear: primary.publishedYear ?? fallback.publishedYear,
    publisher: primary.publisher ?? fallback.publisher,
    coverUrl: primary.coverUrl ?? fallback.coverUrl,
    description: primary.description ?? fallback.description,
  };
}

export async function lookupIsbn(raw: string): Promise<IsbnLookup> {
  const isbn = normalizeIsbn(raw);
  if (!isbn) {
    throw new Error("Podaj poprawny ISBN-10 lub ISBN-13.");
  }

  const [openLibrary, google, bn] = await Promise.all([
    lookupOpenLibrary(isbn),
    lookupGoogleBooks(isbn),
    lookupNationalLibrary(isbn),
  ]);

  // Kolejność scalania: Open Library → Google Books → Biblioteka Narodowa
  const result = mergeLookups(mergeLookups(openLibrary, google), bn);
  if (!result) {
    throw new Error("Nie znaleziono książki dla tego ISBN.");
  }

  return result;
}