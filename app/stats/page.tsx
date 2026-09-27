import Link from "next/link";
import { listBooks } from "@/lib/store";

function pluralKsiazka(n: number): string {
  if (n === 1) return "książka";
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) {
    return "książki";
  }
  return "książek";
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-[#8a7f72]">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl text-[#1f1a14]">{value}</p>
    </div>
  );
}

export default async function StatsPage() {
  const books = await listBooks();

  const read = books.filter((b) => b.status === "read");
  const reading = books.filter((b) => b.status === "reading");
  const want = books.filter((b) => b.status === "want");

  const totalPagesRead = read.reduce((sum, b) => sum + (b.pageCount ?? 0), 0);
  const pagesInProgress = reading.reduce((sum, b) => sum + b.currentPage, 0);

  const booksWithPages = read.filter((b) => b.pageCount != null);
  const averagePages =
    booksWithPages.length > 0
      ? Math.round(
          booksWithPages.reduce((sum, b) => sum + (b.pageCount ?? 0), 0) /
            booksWithPages.length,
        )
      : 0;

  // Podział po latach
  const byYear = new Map<string, { count: number; pages: number }>();
  for (const book of read) {
    if (!book.finishedAt) continue;
    const year = new Date(book.finishedAt).getFullYear().toString();
    const entry = byYear.get(year) ?? { count: 0, pages: 0 };
    entry.count += 1;
    entry.pages += book.pageCount ?? 0;
    byYear.set(year, entry);
  }
  const years = Array.from(byYear.entries()).sort((a, b) =>
    b[0].localeCompare(a[0]),
  );

  const currentYear = new Date().getFullYear().toString();
  const thisYear = byYear.get(currentYear) ?? { count: 0, pages: 0 };

  // Top autorzy (na podstawie przeczytanych)
  const authorCount = new Map<string, number>();
  for (const book of read) {
    for (const author of book.authors) {
      authorCount.set(author, (authorCount.get(author) ?? 0) + 1);
    }
  }
  const topAuthors = Array.from(authorCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Najdłuższa
  const longest = booksWithPages
    .slice()
    .sort((a, b) => (b.pageCount ?? 0) - (a.pageCount ?? 0))[0];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-16">
      <Link
        href="/"
        className="text-xs uppercase tracking-[0.2em] text-[#8a7f72]"
      >
        ← Półka
      </Link>
      <h1 className="mt-6 font-serif text-4xl">Statystyki</h1>
      <p className="mt-3 max-w-lg text-[#6b6258] leading-7">
        Liczby z Twojej półki — bez wykresów na cały ekran, bez porównań z
        innymi.
      </p>

      {/* Karty ogólne */}
      <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
        <Stat label="Na półce" value={books.length} />
        <Stat label="Przeczytane" value={read.length} />
        <Stat label="Czytam" value={reading.length} />
        <Stat label="Chcę przeczytać" value={want.length} />
      </div>

      {/* Strony */}
      <section className="mt-16 border-t border-[#e6dfd2] pt-10">
        <h2 className="font-serif text-2xl">Strony</h2>
        <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
          <Stat label="Przeczytane strony" value={totalPagesRead} />
          <Stat label="W trakcie" value={pagesInProgress} />
          <Stat
            label="Średnio na książkę"
            value={averagePages > 0 ? averagePages : "—"}
          />
        </div>
      </section>

      {/* Ten rok */}
      <section className="mt-16 border-t border-[#e6dfd2] pt-10">
        <h2 className="font-serif text-2xl">{currentYear} w liczbach</h2>
        {thisYear.count === 0 ? (
          <p className="mt-4 text-[#6b6258]">
            Jeszcze nic w tym roku. Pierwsza książka przed Tobą.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
            <Stat label="Przeczytane" value={thisYear.count} />
            <Stat
              label="Stron"
              value={thisYear.pages > 0 ? thisYear.pages : "—"}
            />
          </div>
        )}
      </section>

      {/* Rok po roku */}
      {years.length > 0 ? (
        <section className="mt-16 border-t border-[#e6dfd2] pt-10">
          <h2 className="font-serif text-2xl">Rok po roku</h2>
          <table className="mt-6 w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.16em] text-[#8a7f72]">
                <th className="py-2 font-normal">Rok</th>
                <th className="py-2 text-right font-normal">Książek</th>
                <th className="py-2 text-right font-normal">Stron</th>
              </tr>
            </thead>
            <tbody>
              {years.map(([year, data]) => (
                <tr key={year} className="border-t border-[#e6dfd2]">
                  <td className="py-2 font-serif text-lg">{year}</td>
                  <td className="py-2 text-right">{data.count}</td>
                  <td className="py-2 text-right">
                    {data.pages > 0 ? data.pages : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {/* Top autorzy */}
      {topAuthors.length > 0 ? (
        <section className="mt-16 border-t border-[#e6dfd2] pt-10">
          <h2 className="font-serif text-2xl">Najczęściej czytani</h2>
          <ul className="mt-6 flex flex-col text-sm">
            {topAuthors.map(([author, count]) => (
              <li
                key={author}
                className="flex justify-between border-t border-[#e6dfd2] py-2 first:border-t-0"
              >
                <span>{author}</span>
                <span className="text-[#8a7f72]">
                  {count} {pluralKsiazka(count)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Najdłuższa */}
      {longest ? (
        <section className="mt-16 border-t border-[#e6dfd2] pt-10">
          <h2 className="font-serif text-2xl">Najdłuższa</h2>
          <p className="mt-4 text-[#6b6258]">
            <Link
              href={`/books/${longest.id}`}
              className="text-[#1f1a14] underline underline-offset-4"
            >
              {longest.title}
            </Link>{" "}
            — {longest.pageCount} stron
          </p>
        </section>
      ) : null}
    </div>
  );
}