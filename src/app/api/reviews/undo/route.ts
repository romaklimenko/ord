import { NextResponse } from "next/server";
import { hentAktuelBruger } from "@/lib/session";
import { fortrydSidsteReview } from "@/lib/study";

export const runtime = "nodejs";

export async function POST() {
  const bruger = await hentAktuelBruger();
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
