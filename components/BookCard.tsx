import Link from "next/link";
import type { Book } from "@/lib/types";
import { Cover } from "./Cover";

const statusLabel = {
  want: "Chcę przeczytać",
  reading: "Czytam",
  read: "Przeczytane",
} as const;

export function BookCard({ book }: { book: Book }) {
  const percent =
    book.pageCount && book.pageCount > 0
      ? Math.round((book.currentPage / book.pageCount) * 100)
      : book.status === "read"
        ? 100
        : 0;

  return (
    <Link href={`/books/${book.id}`} className="group block">
      <Cover book={book} />
      <h2 className="mt-3 max-w-[160px] font-serif text-lg leading-tight text-[#1f1a14] group-hover:underline">
        {book.title}
      </h2>
      <p className="mt-1 max-w-[160px] text-sm text-[#6b6258]">
        {book.authors.join(", ") || "Autor nieznany"}
      </p>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#8a7f72]">
        {statusLabel[book.status]}
      </p>
      {book.pageCount ? (
        <div className="mt-2 h-[2px] w-[160px] bg-[#e6dfd2]">
          <div
            className="h-full bg-[#1f1a14]"
            style={{ width: `${percent}%` }}
          />
        </div>
      ) : null}
    </Link>
  );
}
