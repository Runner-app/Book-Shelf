import { AddIsbnForm } from "@/components/AddIsbnForm";
import { BookCard } from "@/components/BookCard";
import { ShelfNav } from "@/components/ShelfNav";
import { listBooks } from "@/lib/store";
import Link from "next/link";
import type { ReadingStatus } from "@/lib/types";

function isStatus(value: string | undefined): value is ReadingStatus {
  return value === "want" || value === "reading" || value === "read";
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = isStatus(status) ? status : "all";
  const books = await listBooks();
  const visible =
    active === "all" ? books : books.filter((book) => book.status === active);

  const reading = books.filter((book) => book.status === "reading").length;
  const pages = books.reduce((sum, book) => sum + book.currentPage, 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-6 py-16">
      <p className="text-xl uppercase tracking-[0.28em] text-[#8a7f72]">BookShelf</p>
      <h1 className="mt-3 font-serif text-5xl tracking-tight">Półka</h1>
      <p className="mt-6 text-sm text-[#8a7f72]">
        {books.length} na półce
        {reading ? ` · ${reading} w trakcie` : ""}
        {pages ? ` · ${pages} stron przeczytanych` : ""}
      </p>
      <Link
        href="/stats"
        className="mt-3 self-start text-xs uppercase tracking-[0.2em] text-[#8a7f72] underline underline-offset-4"
      >
        Statystyki
      </Link>
      <ShelfNav active={active} />
      <div className="mt-12 flex flex-wrap gap-x-8 gap-y-12">
        {visible.length === 0 ? (
          <p className="text-[#6b6258]">
            {books.length === 0
              ? "Półka jest pusta. Dodaj pierwszą książkę poniżej."
              : "Nic w tym widoku."}
          </p>
        ) : (
          visible.map((book) => <BookCard key={book.id} book={book} />)
        )}
      </div>
      <div className="mt-20">
        <AddIsbnForm />
      </div>
    </div>
  );
}
