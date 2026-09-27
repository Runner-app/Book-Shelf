"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { updateBook, type BookEditInput } from "@/app/actions";
import type { Book } from "@/lib/types";

export function EditBookForm({ book }: { book: Book }) {
  const router = useRouter();
  const [form, setForm] = useState<BookEditInput>({
    title: book.title,
    authors: book.authors.join(", "),
    pageCount: book.pageCount?.toString() ?? "",
    publishedYear: book.publishedYear ?? "",
    publisher: book.publisher ?? "",
    coverUrl: book.coverUrl ?? "",
    description: book.description ?? "",
    finishedAt: book.finishedAt ? book.finishedAt.slice(0, 10) : "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update<K extends keyof BookEditInput>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await updateBook(book.id, form);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const inputCls =
    "w-full border-b border-[#1f1a14] bg-transparent px-0 py-2 text-[#1f1a14] outline-none placeholder:text-[#b3aa9e]";
  const labelCls = "text-xs uppercase tracking-[0.16em] text-[#8a7f72]";

  return (
    <form onSubmit={onSubmit} className="mt-8 flex max-w-xl flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className={labelCls}>Tytuł *</span>
        <input
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelCls}>Autorzy (oddziel przecinkami)</span>
        <input
          value={form.authors}
          onChange={(e) => update("authors", e.target.value)}
          className={inputCls}
        />
      </label>

      <div className="flex gap-5">
        <label className="flex flex-1 flex-col gap-1">
          <span className={labelCls}>Liczba stron</span>
          <input
            value={form.pageCount}
            onChange={(e) => update("pageCount", e.target.value)}
            inputMode="numeric"
            className={inputCls}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className={labelCls}>Rok wydania</span>
          <input
            value={form.publishedYear}
            onChange={(e) => update("publishedYear", e.target.value)}
            inputMode="numeric"
            className={inputCls}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className={labelCls}>Wydawca</span>
        <input
          value={form.publisher}
          onChange={(e) => update("publisher", e.target.value)}
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelCls}>URL okładki</span>
        <input
          value={form.coverUrl}
          onChange={(e) => update("coverUrl", e.target.value)}
          placeholder="https://..."
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelCls}>Data ukończenia</span>
        <input
          type="date"
          value={form.finishedAt ?? ""}
          onChange={(e) => update("finishedAt", e.target.value)}
          className={inputCls}
        />
        <span className="text-xs text-[#8a7f72]">
          Zostaw puste, jeśli jeszcze nie skończyłeś.
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className={labelCls}>Opis</span>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
          className={`${inputCls} resize-none`}
        />
      </label>

      {error ? <p className="text-sm text-[#8a3d2b]">{error}</p> : null}

      <div className="flex items-center gap-5">
        <button
          type="submit"
          disabled={busy}
          className="text-sm uppercase tracking-[0.18em] text-[#1f1a14] underline underline-offset-4 disabled:opacity-40"
        >
          {busy ? "Zapisuję…" : "Zapisz"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm uppercase tracking-[0.18em] text-[#8a7f72]"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}