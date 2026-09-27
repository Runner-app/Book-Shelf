"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { removeBook, updateReading } from "@/app/actions";
import type { Book, ReadingStatus } from "@/lib/types";

const statuses: { value: ReadingStatus; label: string }[] = [
  { value: "want", label: "Chcę przeczytać" },
  { value: "reading", label: "Czytam" },
  { value: "read", label: "Przeczytane" },
];

export function ReadingControls({ book }: { book: Book }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [page, setPage] = useState(book.currentPage);
  const [error, setError] = useState<string | null>(null);

  const percent =
    book.pageCount && book.pageCount > 0
      ? Math.round((page / book.pageCount) * 100)
      : book.status === "read"
        ? 100
        : 0;

  function persist(patch: { currentPage?: number; status?: ReadingStatus }) {
    startTransition(async () => {
      const result = await updateReading(book.id, patch);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      setPage(result.data.currentPage);
      router.refresh();
    });
  }

  return (
    <div className="mt-10 max-w-md">
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {statuses.map((status) => (
          <button
            key={status.value}
            type="button"
            disabled={pending}
            onClick={() => persist({ status: status.value })}
            className={`text-sm uppercase tracking-[0.16em] ${
              book.status === status.value
                ? "text-[#1f1a14] underline underline-offset-4"
                : "text-[#8a7f72]"
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {book.pageCount ? (
        <div className="mt-8">
          <div className="flex justify-between text-sm text-[#6b6258]">
            <span>
              Strona {page} z {book.pageCount}
            </span>
            <span>{percent}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={book.pageCount}
            value={page}
            disabled={pending}
            onChange={(event) => setPage(Number(event.target.value))}
            onPointerUp={(event) =>
              persist({
                currentPage: Number((event.target as HTMLInputElement).value),
              })
            }
            onKeyUp={(event) =>
              persist({
                currentPage: Number((event.target as HTMLInputElement).value),
              })
            }
            className="mt-3 w-full accent-[#1f1a14]"
            aria-label="Bieżąca strona"
          />
        </div>
      ) : (
        <p className="mt-8 text-sm text-[#6b6258]">
          Brak liczby stron w katalogu — oznacz status ręcznie.
        </p>
      )}

      {error ? <p className="mt-4 text-sm text-[#8a3d2b]">{error}</p> : null}

      <button
        type="button"
        className="mt-10 text-xs uppercase tracking-[0.16em] text-[#8a7f72]"
        onClick={() => {
          startTransition(async () => {
            const result = await removeBook(book.id);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push("/");
            router.refresh();
          });
        }}
      >
        Usuń z półki
      </button>
    </div>
  );
}
