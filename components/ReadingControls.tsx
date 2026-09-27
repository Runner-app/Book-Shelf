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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removing, setRemoving] = useState(false);

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

  function confirmRemove() {
    setRemoving(true);
    setError(null);
    startTransition(async () => {
      const result = await removeBook(book.id);
      if (!result.ok) {
        setError(result.error);
        setRemoving(false);
        setConfirmOpen(false);
        return;
      }
      router.push("/");
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
        className="mt-10 cursor-pointer text-xs uppercase tracking-[0.16em] text-[#8a7f72]"
        onClick={() => setConfirmOpen(true)}
      >
        Usuń z półki
      </button>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1f1a14]/40 px-4"
          onClick={() => {
            if (!removing) setConfirmOpen(false);
          }}
        >
          <div
            className="w-full max-w-sm bg-[#f7f1e6] p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 className="font-serif text-xl text-[#1f1a14]">
              Usunąć tę książkę?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#6b6258]">
              „{book.title}" zniknie z półki razem z postępem czytania. Tego
              nie da się cofnąć.
            </p>
            <div className="mt-6 flex justify-end gap-5 text-xs uppercase tracking-[0.16em]">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={removing}
                className="cursor-pointer text-[#8a7f72] disabled:opacity-40"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={confirmRemove}
                disabled={removing}
                className="cursor-pointer text-[#8a3d2b] underline underline-offset-4 disabled:opacity-40"
              >
                {removing ? "Usuwam…" : "Usuń"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}