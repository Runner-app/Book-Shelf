"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { addBookManual, type ManualBookInput } from "@/app/actions";

const empty: ManualBookInput = {
  title: "",
  authors: "",
  pageCount: "",
  publishedYear: "",
  publisher: "",
  coverUrl: "",
  description: "",
};

export function AddManualForm() {
  const router = useRouter();
  const [form, setForm] = useState<ManualBookInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function update<K extends keyof ManualBookInput>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await addBookManual(form);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setForm(empty);
    router.push(`/books/${result.data.id}`);
    router.refresh();
  }

  const inputCls =
    "w-full border-b border-[#1f1a14] bg-transparent px-0 py-2 text-[#1f1a14] outline-none placeholder:text-[#b3aa9e]";

  return (
    <form onSubmit={onSubmit} className="mt-6 flex max-w-xl flex-col gap-5">
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8a7f72]">
          Tytuł *
        </span>
        <input
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
          required
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8a7f72]">
          Autorzy (oddziel przecinkami)
        </span>
        <input
          value={form.authors}
          onChange={(e) => update("authors", e.target.value)}
          className={inputCls}
        />
      </label>

      <div className="flex gap-5">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.16em] text-[#8a7f72]">
            Liczba stron
          </span>
          <input
            value={form.pageCount}
            onChange={(e) => update("pageCount", e.target.value)}
            inputMode="numeric"
            className={inputCls}
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs uppercase tracking-[0.16em] text-[#8a7f72]">
            Rok wydania
          </span>
          <input
            value={form.publishedYear}
            onChange={(e) => update("publishedYear", e.target.value)}
            inputMode="numeric"
            className={inputCls}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8a7f72]">
          Wydawca
        </span>
        <input
          value={form.publisher}
          onChange={(e) => update("publisher", e.target.value)}
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8a7f72]">
          URL okładki
        </span>
        <input
          value={form.coverUrl}
          onChange={(e) => update("coverUrl", e.target.value)}
          placeholder="https://..."
          className={inputCls}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.16em] text-[#8a7f72]">
          Opis
        </span>
        <textarea
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
          className={`${inputCls} resize-none`}
        />
      </label>

      {error ? <p className="text-sm text-[#8a3d2b]">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="mt-2 self-start text-sm uppercase tracking-[0.18em] text-[#1f1a14] underline underline-offset-4 disabled:opacity-40"
      >
        {busy ? "Dodaję…" : "Dodaj na półkę"}
      </button>
    </form>
  );
}