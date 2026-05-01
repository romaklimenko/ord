import { Træner } from "@/components/Traener";
import { hentAktuelBruger } from "@/lib/session";
import { hentStudieSnapshot } from "@/lib/study";

export const dynamic = "force-dynamic";

export default async function Forside() {
  const bruger = await hentAktuelBruger();
  const snapshot = await hentStudieSnapshot(bruger.id);

  return <Træner bruger={bruger} førsteSnapshot={snapshot} />;
}
