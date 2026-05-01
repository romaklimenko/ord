import Link from "next/link";
import { hentAktuelBruger } from "@/lib/session";
import { hentStudieSnapshot } from "@/lib/study";
import styles from "./statistik.module.css";

export const dynamic = "force-dynamic";

export default async function StatistikSide() {
  const bruger = await hentAktuelBruger();
  const { statistik } = await hentStudieSnapshot(bruger.id);

  return (
    <main className={styles.side}>
      <header className={styles.toplinje}>
        <Link href="/">Ord</Link>
        <span>{bruger.navn}</span>
      </header>

      <section className={styles.indhold}>
        <h1>Statistik</h1>
        <dl className={styles.grid}>
          <div>
            <dt>Kort i alt</dt>
            <dd>{statistik.totalCards}</dd>
          </div>
          <div>
            <dt>Set</dt>
            <dd>{statistik.setCards}</dd>
          </div>
          <div>
            <dt>Modne</dt>
            <dd>{statistik.modneCards}</dd>
          </div>
          <div>
            <dt>Til repetition</dt>
            <dd>{statistik.dueToday}</dd>
          </div>
          <div>
            <dt>Svar i dag</dt>
            <dd>{statistik.svarIDag}</dd>
          </div>
          <div>
            <dt>Rigtige i dag</dt>
            <dd>{statistik.rigtigeIDag}</dd>
          </div>
          <div>
            <dt>Forkerte i dag</dt>
            <dd>{statistik.forkerteIDag}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
