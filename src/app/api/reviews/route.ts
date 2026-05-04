import { NextResponse } from "next/server";
import { erGæst, hentAktuelBruger } from "@/lib/session";
import { hentStudieSnapshot, registrerReview } from "@/lib/study";
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

  // Gæster kan prøve appen, men deres svar gemmes ikke. Vi springer
  // skrivningen over og giver bare det næste kort.
  if (erGæst(bruger)) {
    const snapshot = await hentStudieSnapshot(bruger.id);
    return NextResponse.json(snapshot);
  }

  const snapshot = await registrerReview(bruger.id, body.cardId, body.rating);
  return NextResponse.json(snapshot);
}
