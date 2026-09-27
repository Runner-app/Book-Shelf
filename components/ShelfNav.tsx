import Link from "next/link";
import type { ReadingStatus } from "@/lib/types";

const filters: { href: string; label: string; value: ReadingStatus | "all" }[] =
  [
    { href: "/", label: "Wszystkie", value: "all" },
    { href: "/?status=reading", label: "Czytam", value: "reading" },
    { href: "/?status=want", label: "Chcę przeczytać", value: "want" },
    { href: "/?status=read", label: "Przeczytane", value: "read" },
  ];

export function ShelfNav({ active }: { active: ReadingStatus | "all" }) {
  return (
    <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm uppercase tracking-[0.16em]">
      {filters.map((filter) => (
        <Link
          key={filter.value}
          href={filter.href}
          className={
            active === filter.value
              ? "text-[#1f1a14] underline underline-offset-4"
              : "text-[#8a7f72]"
          }
        >
          {filter.label}
        </Link>
      ))}
    </nav>
  );
}
