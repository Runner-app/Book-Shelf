import { NextResponse } from "next/server";
import { lookupIsbn, normalizeIsbn } from "@/lib/isbn";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ isbn: string }> },
) {
  const { isbn } = await params;
  if (!normalizeIsbn(isbn)) {
    return NextResponse.json(
      { error: "Podaj poprawny ISBN-10 lub ISBN-13." },
      { status: 400 },
    );
  }

  try {
    const data = await lookupIsbn(isbn);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Nie udało się pobrać ISBN.",
      },
      { status: 404 },
    );
  }
}
