import { NextResponse } from "next/server";
import { hentAktuelBruger } from "@/lib/session";
import { hentStudieSnapshot } from "@/lib/study";

export const runtime = "nodejs";
export const preferredRegion = "fra1";

export async function GET() {
  const bruger = await hentAktuelBruger();
  const snapshot = await hentStudieSnapshot(bruger.id);
  return NextResponse.json(snapshot);
}
