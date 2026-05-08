import Link from "next/link";
import { redirect } from "next/navigation";
import { erGæst, hentAktuelBruger } from "@/lib/session";
import { hentStatistikOversigt } from "@/lib/study";
import styles from "./statistik.module.css";

export const dynamic = "force-dynamic";

export default async function StatistikSide() {
  const bruger = await hentAktuelBruger();
  if (erGæst(bruger)) {
    redirect("/auth/login");
  }
  const { statistik, dage } = await hentStatistikOversigt(bruger.id);
  const maxSvar = Math.max(1, ...dage.map((dag) => dag.svar));

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

        <section className={styles.diagram} aria-labelledby="daglig-aktivitet">
          <div className={styles.sektionTop}>
            <h2 id="daglig-aktivitet">Seneste 30 dage</h2>
            <p>
              {statistik.rigtigeIDag} rigtige og {statistik.forkerteIDag} forkerte i dag
            </p>
          </div>
          <ol className={styles.søjler}>
            {dage.map((dag) => {
              const søjleHøjde = Math.max(4, Math.round((dag.svar / maxSvar) * 100));
              const rigtigeAndel = dag.svar > 0 ? Math.round((dag.rigtige / dag.svar) * 100) : 0;
              const forkerteAndel = dag.svar > 0 ? 100 - rigtigeAndel : 0;

              return (
                <li key={dag.dato}>
                  <div
                    className={styles.søjle}
                    style={{ height: `${søjleHøjde}%` }}
                    title={`${dag.dato}: ${dag.svar} svar, ${dag.rigtige} rigtige, ${dag.forkerte} forkerte`}
                  >
                    <span className={styles.rigtige} style={{ height: `${rigtigeAndel}%` }} />
                    <span className={styles.forkerte} style={{ height: `${forkerteAndel}%` }} />
                  </div>
                  <span>{dag.dato.slice(6, 8)}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section className={styles.diagram} aria-labelledby="korpus-fordeling">
          <div className={styles.sektionTop}>
            <h2 id="korpus-fordeling">Korpus pr. dag</h2>
            <ul className={styles.legende}>
              <li>
                <span className={`${styles.legendePrik} ${styles.modne}`} aria-hidden="true" />
                Modne
              </li>
              <li>
                <span className={`${styles.legendePrik} ${styles.set}`} aria-hidden="true" />
                Set
              </li>
              <li>
                <span className={`${styles.legendePrik} ${styles.tilRep}`} aria-hidden="true" />
                Til repetition
              </li>
              <li>
                <span className={`${styles.legendePrik} ${styles.uset}`} aria-hidden="true" />
                Ikke set
              </li>
            </ul>
          </div>
          <ol className={styles.korpusSøjler}>
            {dage.map((dag) => {
              const harSnapshot = typeof dag.kortIAlt === "number" && dag.kortIAlt > 0;
              if (!harSnapshot) {
                return <li key={dag.dato} className={styles.tomDag} aria-hidden="true" />;
              }
              const kortIAlt = dag.kortIAlt ?? 0;
              const setCards = dag.setCards ?? 0;
              const modne = dag.modneCards ?? 0;
              const tilRep = dag.tilRepetition ?? 0;
              // Yellow = set − modne − tilRep. Disjoint segmenter, så summen
              // altid er kortIAlt.
              const setAndet = Math.max(0, setCards - modne - tilRep);
              const uset = Math.max(0, kortIAlt - modne - setAndet - tilRep);
              const procent = (n: number) => (n / kortIAlt) * 100;

              return (
                <li
                  key={dag.dato}
                  title={`${dag.dato}: ${modne} modne, ${setAndet} set, ${tilRep} til repetition, ${uset} ikke set`}
                >
                  <div className={styles.korpusSøjle}>
                    <span className={styles.uset} style={{ height: `${procent(uset)}%` }} />
                    <span className={styles.tilRep} style={{ height: `${procent(tilRep)}%` }} />
                    <span className={styles.set} style={{ height: `${procent(setAndet)}%` }} />
                    <span className={styles.modne} style={{ height: `${procent(modne)}%` }} />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </section>
    </main>
  );
}
