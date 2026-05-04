import { NextResponse } from "next/server";
import { erGæst, hentAktuelBruger } from "@/lib/session";
import { fortrydSidsteReview, hentStudieSnapshot } from "@/lib/study";

export const runtime = "nodejs";

export async function POST() {
  const bruger = await hentAktuelBruger();
  // Gæster har intet review at fortryde. Returnér nuværende snapshot.
  if (erGæst(bruger)) {
    return NextResponse.json(await hentStudieSnapshot(bruger.id));
  }
  try {
    const snapshot = await fortrydSidsteReview(bruger.id);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunne ikke fortryde." },
      { status: 409 },
    );
  }
}
