"use client";

import Image from "next/image";
import { useState } from "react";
import type { Book } from "@/lib/types";

export function Cover({
  book,
  size = "md",
}: {
  book: Pick<Book, "title" | "coverUrl">;
  size?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const dims =
    size === "lg"
      ? { width: 280, height: 420, className: "h-[420px] w-[280px]" }
      : size === "sm"
        ? { width: 72, height: 108, className: "h-[108px] w-[72px]" }
        : { width: 160, height: 240, className: "h-[240px] w-[160px]" };

  if (!book.coverUrl || failed) {
    return (
      <div
        className={`${dims.className} flex items-end bg-[#2c241b] p-3 text-left text-sm leading-snug text-[#f4efe6] shadow-md`}
        aria-hidden
      >
        {book.title}
      </div>
    );
  }

  return (
    <Image
      src={book.coverUrl}
      alt={`Okładka: ${book.title}`}
      width={dims.width}
      height={dims.height}
      className={`${dims.className} object-cover shadow-md`}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}
