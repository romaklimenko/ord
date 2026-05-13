import { Træner } from "@/components/Traener";
import { erGæst, hentAktuelBruger } from "@/lib/session";
import { hentStudieSnapshot } from "@/lib/study";

export const dynamic = "force-dynamic";
export const preferredRegion = "fra1";

export default async function Forside() {
  const bruger = await hentAktuelBruger();
  const snapshot = await hentStudieSnapshot(bruger.id, { gæst: erGæst(bruger) });

  return <Træner bruger={bruger} førsteSnapshot={snapshot} />;
}
