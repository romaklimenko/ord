import { NextResponse } from "next/server";
import { erGæst, hentAktuelBruger } from "@/lib/session";
import { forberedReview, hentStudieSnapshot } from "@/lib/study";
import type { ReviewRating } from "@/lib/types";

export const runtime = "nodejs";

function erRating(value: unknown): value is ReviewRating {
  return value === "wrong" || value === "correct";
}

function timingNavn(navn: string) {
  return navn.replace(/[^a-zA-Z0-9_-]/g, "");
}

async function mål<T>(timings: string[], navn: string, handling: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await handling();
  } finally {
    timings.push(`${timingNavn(navn)};dur=${(performance.now() - start).toFixed(1)}`);
  }
}

function jsonMedTiming(body: unknown, timings: string[], init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  if (timings.length > 0) {
    response.headers.set("Server-Timing", timings.join(", "));
  }
  return response;
}

export async function POST(request: Request) {
  const timings: string[] = [];
  const body = await mål(timings, "body", async () => {
    return (await request.json()) as { cardId?: unknown; rating?: unknown };
  });

  if (typeof body.cardId !== "string" || !erRating(body.rating)) {
    return jsonMedTiming({ error: "Ugyldigt svar." }, timings, { status: 400 });
  }
  const cardId = body.cardId;
  const rating = body.rating;

  const bruger = await mål(timings, "auth", () => hentAktuelBruger());

  // Gæster kan prøve appen, men deres svar gemmes ikke. Vi springer
  // skrivningen over og giver bare det næste kort.
  if (erGæst(bruger)) {
    const snapshot = await mål(timings, "study", () => hentStudieSnapshot(bruger.id));
    return jsonMedTiming(snapshot, timings);
  }

  const review = await mål(timings, "prepare", () => forberedReview(bruger.id, cardId, rating));
  await mål(timings, "save", () => review.gem());

  return jsonMedTiming(review.snapshot, timings);
}
