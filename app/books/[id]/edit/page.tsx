import Link from "next/link";
import { notFound } from "next/navigation";
import { EditBookForm } from "@/components/EditBookForm";
import { getBook } from "@/lib/store";

export default async function EditBookPage({
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
        href={`/books/${book.id}`}
        className="text-xs uppercase tracking-[0.2em] text-[#8a7f72]"
      >
        ← {book.title}
      </Link>
      <h1 className="mt-6 font-serif text-4xl">Edytuj książkę</h1>
      <EditBookForm book={book} />
    </div>
  );
}