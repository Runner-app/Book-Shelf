import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/Cover";
import { ReadingControls } from "@/components/ReadingControls";
import { getBook } from "@/lib/store";

export default async function BookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-6 py-16">
      <Link
        href="/"
        className="text-xs uppercase tracking-[0.2em] text-[#8a7f72]"
      >
        ← Półka
      </Link>
      <div className="mt-4 flex gap-5 text-xs uppercase tracking-[0.2em]">
        <Link href={`/books/${book.id}/edit`} className="text-[#8a7f72]">
          Edytuj
        </Link>
      </div>

      <div className="mt-10 flex flex-col gap-10 sm:flex-row">
        <Cover book={book} size="lg" />
        <div>
          <h1 className="font-serif text-4xl leading-tight">{book.title}</h1>
          <p className="mt-3 text-lg text-[#6b6258]">
            {book.authors.join(", ") || "Autor nieznany"}
          </p>
          <p className="mt-4 text-sm text-[#8a7f72]">
            {[
              book.isbn.startsWith("manual:") ? null : `ISBN ${book.isbn}`,
              book.publisher,
              book.publishedYear,
              book.pageCount ? `${book.pageCount} stron` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {book.finishedAt ? (
            <p className="mt-2 text-sm text-[#8a7f72]">
              Przeczytane{" "}
              {new Date(book.finishedAt).toLocaleDateString("pl-PL", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          ) : null}
          {book.description ? (
            <p className="mt-6 max-w-prose text-sm leading-7 text-[#6b6258]">
              {book.description}
            </p>
          ) : null}
          <ReadingControls book={book} />
        </div>
      </div>
    </div>
  );
}