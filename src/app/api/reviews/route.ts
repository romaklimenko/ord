import { NextResponse } from "next/server";
import { hentAktuelBruger } from "@/lib/session";
import { registrerReview } from "@/lib/study";
import type { ReviewRating } from "@/lib/types";

export const runtime = "nodejs";

function erRating(value: unknown): value is ReviewRating {
  return value === "wrong" || value === "correct";
}

export async function POST(request: Request) {
  const body = (await request.json()) as { cardId?: unknown; rating?: unknown };

  if (typeof body.cardId !== "string" || !erRating(body.rating)) {
    return NextResponse.json({ error: "Ugyldigt svar." }, { status: 400 });
  }

  const bruger = await hentAktuelBruger();
  const snapshot = await registrerReview(bruger.id, body.cardId, body.rating);
  return NextResponse.json(snapshot);
}
