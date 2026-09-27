"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addBookFromIsbn, previewIsbn } from "@/app/actions";
import type { IsbnLookup } from "@/lib/types";
import { AddManualForm } from "./AddManualForm";

export function AddIsbnForm() {
  const router = useRouter();
  const [isbn, setIsbn] = useState("");
  const [preview, setPreview] = useState<IsbnLookup | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"preview" | "add" | null>(null);
  const [mode, setMode] = useState<"isbn" | "manual">("isbn");

  async function onPreview(event: React.FormEvent) {
    event.preventDefault();
    setBusy("preview");
    setError(null);
    const result = await previewIsbn(isbn);
    setBusy(null);
    if (!result.ok) {
      setPreview(null);
      setError(result.error);
      return;
    }
    setPreview(result.data);
  }

  async function onAdd() {
    setBusy("add");
    setError(null);
    const result = await addBookFromIsbn(isbn);
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setIsbn("");
    setPreview(null);
    router.push(`/books/${result.data.id}`);
    router.refresh();
  }

  return (
    <section className="border-t border-[#e6dfd2] pt-10">
      <h2 className="font-serif text-2xl text-[#1f1a14]">Dodaj książkę</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#6b6258]">
        Wpisz ISBN z grzbietu albo strony redakcyjnej. Pobierzemy tytuł, autora,
        liczbę stron i okładkę.
      </p>
      <div className="mt-4 flex gap-4 text-xs uppercase tracking-[0.16em]">
        <button
          type="button"
          onClick={() => setMode("isbn")}
          className={
            mode === "isbn" ? "text-[#1f1a14] underline underline-offset-4" : "text-[#8a7f72]"
          }
        >
          Przez ISBN
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={
            mode === "manual" ? "text-[#1f1a14] underline underline-offset-4" : "text-[#8a7f72]"
          }
        >
          Ręcznie
        </button>
      </div>

      {mode === "isbn" ? (
        <>
          {/* tutaj zostaje cały istniejący <form onSubmit={onPreview}> i podgląd */}
        </>
      ) : (
        <AddManualForm />
      )}
      <form onSubmit={onPreview} className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
        <input
          value={isbn}
          onChange={(event) => setIsbn(event.target.value)}
          placeholder="978-83-..."
          inputMode="numeric"
          aria-label="Numer ISBN"
          className="flex-1 border-b border-[#1f1a14] bg-transparent px-0 py-2 text-[#1f1a14] outline-none placeholder:text-[#b3aa9e]"
        />
        <button
          type="submit"
          disabled={busy !== null || isbn.trim().length < 10}
          className="text-sm uppercase tracking-[0.18em] text-[#1f1a14] disabled:opacity-40"
        >
          {busy === "preview" ? "Szukam…" : "Szukaj"}
        </button>
      </form>
      {error ? <p className="mt-4 text-sm text-[#8a3d2b]">{error}</p> : null}
      {preview ? (
        <div className="mt-8 flex gap-6">
          {preview.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.coverUrl}
              alt=""
              className="h-[180px] w-[120px] object-cover shadow-md"
            />
          ) : (
            <div className="flex h-[180px] w-[120px] items-end bg-[#2c241b] p-2 text-xs text-[#f4efe6]">
              {preview.title}
            </div>
          )}
          <div>
            <p className="font-serif text-xl">{preview.title}</p>
            <p className="mt-1 text-sm text-[#6b6258]">
              {preview.authors.join(", ") || "Autor nieznany"}
            </p>
            <p className="mt-3 text-sm text-[#6b6258]">
              {[preview.publisher, preview.publishedYear, preview.pageCount ? `${preview.pageCount} stron` : null]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <button
              type="button"
              onClick={onAdd}
              disabled={busy !== null}
              className="mt-5 text-sm uppercase tracking-[0.18em] underline underline-offset-4 disabled:opacity-40"
            >
              {busy === "add" ? "Dodaję…" : "Dodaj na półkę"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
