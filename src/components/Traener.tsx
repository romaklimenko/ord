"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import type { AktuelBruger } from "@/lib/session";
import type { ReviewRating, StudieSnapshot } from "@/lib/types";
import styles from "./Traener.module.css";

type Props = {
  bruger: AktuelBruger;
  førsteSnapshot: StudieSnapshot;
};

type SidsteReview = {
  cardId: string;
  opslagsord: string;
  rating: ReviewRating;
};

export function Træner({ bruger, førsteSnapshot }: Props) {
  const [snapshot, setSnapshot] = useState(førsteSnapshot);
  const [vist, setVist] = useState(false);
  const [sender, setSender] = useState(false);
  const [fejl, setFejl] = useState<string | null>(null);
  const [sidsteReview, setSidsteReview] = useState<SidsteReview | null>(null);

  const kort = snapshot.kort;
  const ordStil = {
    "--ord-stoerrelse": `${beregnOrdStørrelse(kort.opslagsord)}rem`,
  } as CSSProperties;

  const sendReview = useCallback(
    async (rating: ReviewRating) => {
      if (sender) {
        return;
      }

      setSender(true);
      setFejl(null);
      const reviewedKort = { cardId: kort.id, opslagsord: kort.opslagsord, rating };

      try {
        const response = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: kort.id, rating }),
        });

        if (!response.ok) {
          throw new Error("Svaret kunne ikke gemmes.");
        }

        const næsteSnapshot = (await response.json()) as StudieSnapshot;
        setSnapshot(næsteSnapshot);
        setVist(false);
        setSidsteReview(reviewedKort);
      } catch (error) {
        setFejl(error instanceof Error ? error.message : "Der opstod en fejl.");
      } finally {
        setSender(false);
      }
    },
    [kort.id, kort.opslagsord, sender],
  );

  const fortrydReview = useCallback(async () => {
    if (sender || !sidsteReview) {
      return;
    }

    setSender(true);
    setFejl(null);

    try {
      const response = await fetch("/api/reviews/undo", { method: "POST" });
      if (!response.ok) {
        throw new Error("Kunne ikke fortryde svaret.");
      }
      const næsteSnapshot = (await response.json()) as StudieSnapshot;
      setSnapshot(næsteSnapshot);
      setVist(false);
      setSidsteReview(null);
    } catch (error) {
      setFejl(error instanceof Error ? error.message : "Der opstod en fejl.");
    } finally {
      setSender(false);
    }
  }, [sender, sidsteReview]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (event.key === "Enter" && !vist) {
        event.preventDefault();
        setVist(true);
        return;
      }

      if (!vist) {
        return;
      }

      if (event.key === "Enter" || event.key === "ArrowRight" || event.key === "ArrowUp") {
        event.preventDefault();
        void sendReview("correct");
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
        event.preventDefault();
        void sendReview("wrong");
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sendReview, vist]);

  return (
    <main className={styles.side}>
      <header className={styles.toplinje}>
        <Link href="/" className={styles.logo}>
          Ord
        </Link>
        <nav className={styles.navigation} aria-label="Hovednavigation">
          <Link href="/statistik">Statistik</Link>
          {bruger.authAktiv ? (
            <a href="/auth/logout">Log ud</a>
          ) : bruger.authKonfigureret ? (
            <a href="/auth/login">Log ind</a>
          ) : (
            <span title="Auth0 aktiveres, når miljøvariabler er udfyldt.">Lokal bruger</span>
          )}
        </nav>
      </header>

      <section className={styles.træner} aria-live="polite">
        <div className={styles.dagScore}>{snapshot.statistik.svarIDag}</div>

        {sidsteReview && !vist ? (
          <div className={styles.fortrydLinje}>
            <button
              type="button"
              className={styles.fortryd}
              onClick={() => void fortrydReview()}
              disabled={sender}
              title={`Fortryd '${sidsteReview.rating === "correct" ? "Rigtigt" : "Forkert"}' på ${sidsteReview.opslagsord}`}
            >
              Fortryd sidste svar ({sidsteReview.opslagsord})
            </button>
          </div>
        ) : null}

        <article className={vist ? styles.kortDetaljer : styles.kort}>
          <p className={styles.ordklasse}>{oversætOrdklasse(kort.ordklasse)}</p>
          <h1 style={ordStil}>{kort.opslagsord}</h1>

          {vist ? (
            <div className={styles.definition}>
              {renderFrekvensMaerkat(kort)}
              <p className={styles.forklaring}>{renderDefinition(kort)}</p>
              {kort.eksempler.length > 0 ? (
                <div className={styles.eksempler}>
                  <p className={styles.eksemplerLabel}>Eksempler</p>
                  <ul>
                    {kort.eksempler.slice(0, 2).map((eksempel) => (
                      <li key={eksempel}>{eksempel}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {renderKildelink(kort)}
            </div>
          ) : null}
        </article>

        {vist ? (
          <div className={styles.feedback}>
            <button
              type="button"
              className={styles.forkert}
              onClick={() => void sendReview("wrong")}
              disabled={sender}
            >
              Forkert
            </button>
            <button
              type="button"
              className={styles.rigtigt}
              onClick={() => void sendReview("correct")}
              disabled={sender}
            >
              Rigtigt
            </button>
          </div>
        ) : (
          <div className={styles.afsløring}>
            <button
              type="button"
              className={styles.visSvar}
              onClick={() => setVist(true)}
            >
              Vis svar
            </button>
          </div>
        )}

        {fejl ? <p className={styles.fejl}>{fejl}</p> : null}
      </section>

      <footer className={styles.bundlinje}>
        <p>
          {snapshot.statistik.totalCards} ord i alt, {snapshot.statistik.modneCards} modne,{" "}
          {snapshot.statistik.setCards} set, {snapshot.statistik.dueToday} skal øves i dag.
        </p>
        <p className={styles.kilde}>
          Data:{" "}
          <a href="https://wordnet.dk/dannet/data" rel="noreferrer" target="_blank">
            DanNet
          </a>
          , Center for Sprogteknologi/KU og DSL (CC BY-SA 4.0)
        </p>
        <p>
          {vist ? (
            <>
              Brug <kbd>←</kbd> eller <kbd>↓</kbd> for forkert, <kbd>→</kbd>, <kbd>↑</kbd> eller{" "}
              <kbd>Enter</kbd> for rigtigt.
            </>
          ) : (
            <>
              Tryk på <kbd>Enter</kbd> for at åbne detaljer.
            </>
          )}
        </p>
      </footer>
    </main>
  );
}

function oversætOrdklasse(ordklasse: string) {
  const map: Record<string, string> = {
    noun: "substantiv",
    verb: "verbum",
    adjective: "adjektiv",
    adverb: "adverbium",
  };

  return map[ordklasse] ?? ordklasse;
}

const afkortetSluttegn = /([…]|\.\.\.)\s*$/u;

function renderDefinition(kort: import("@/lib/types").Kort) {
  if (!kort.afkortet) {
    return kort.definition;
  }

  const match = afkortetSluttegn.exec(kort.definition);
  if (!match) {
    return kort.definition;
  }

  const startIndeks = match.index;
  const indledning = kort.definition.slice(0, startIndeks);
  const url = kildeUrl(kort);

  if (!url) {
    return kort.definition;
  }

  return (
    <>
      {indledning}
      <a
        className={styles.afkortet}
        href={url}
        rel="noreferrer"
        target="_blank"
        title="Se fuld forklaring hos kilden"
      >
        …
      </a>
    </>
  );
}

function kildeUrl(kort: import("@/lib/types").Kort) {
  if (kort.synsetId) {
    return `https://wordnet.dk/dannet/data/${encodeURIComponent(kort.synsetId)}`;
  }
  if (kort.opslagsord) {
    return `https://ordnet.dk/ddo/ordbog?query=${encodeURIComponent(kort.opslagsord)}`;
  }
  return null;
}

const ALMINDELIGT_GULV = 1e-4;

function frekvensTier(kort: import("@/lib/types").Kort): "almindeligt" | "sjaeldent" | null {
  if (typeof kort.frekvens !== "number") {
    return "sjaeldent";
  }
  if (kort.frekvens >= ALMINDELIGT_GULV) {
    return "almindeligt";
  }
  return null;
}

function renderFrekvensMaerkat(kort: import("@/lib/types").Kort) {
  const tier = frekvensTier(kort);
  if (tier === "almindeligt") {
    return <span className={`${styles.maerkat} ${styles.maerkatAlmindeligt}`}>Almindeligt ord</span>;
  }
  if (tier === "sjaeldent") {
    return <span className={`${styles.maerkat} ${styles.maerkatSjaeldent}`}>Sjældent ord</span>;
  }
  return null;
}

function renderKildelink(kort: import("@/lib/types").Kort) {
  const url = kildeUrl(kort);
  if (!url) {
    return null;
  }
  const label = kort.synsetId ? "Se hos DanNet" : "Slå op i DDO";
  return (
    <p className={styles.kildelink}>
      <a href={url} rel="noreferrer" target="_blank">
        {label} →
      </a>
    </p>
  );
}

function beregnOrdStørrelse(ord: string) {
  const længsteDel = Math.max(...ord.split(/[\s-]+/u).map((del) => del.length), 1);
  const samletLængde = ord.replace(/\s+/gu, "").length;
  const mål = Math.max(længsteDel, Math.round(samletLængde * 0.7));

  if (mål <= 6) {
    return 9;
  }

  if (mål <= 9) {
    return 8;
  }

  if (mål <= 13) {
    return 6.8;
  }

  if (mål <= 17) {
    return 5.4;
  }

  if (mål <= 23) {
    return 4.2;
  }

  return 3.4;
}
