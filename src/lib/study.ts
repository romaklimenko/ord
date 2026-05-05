import { hentKatalog } from "@/lib/catalog";
import { senesteDatoNøgler, tilDatoNøgle } from "@/lib/date";
import { hentDag, hentProgressRepository, type BrugerProgress } from "@/lib/progress";
import { nyKorttilstand, planlægNæsteReview } from "@/lib/sm2";
import type {
  Kort,
  Korttilstand,
  ReviewRating,
  StatistikOversigt,
  StudieSnapshot,
  StudieStatistik,
} from "@/lib/types";
import { frekvensVægt, vægtetTilfældigt } from "@/lib/vaelg";

function erDue(state: { dueAt: string } | undefined, now: Date) {
  return Boolean(state && Date.parse(state.dueAt) <= now.getTime());
}

function erModent(state: { intervalDays: number; seen: number } | undefined) {
  return Boolean(state && state.seen > 0 && state.intervalDays >= 21);
}

const NYLIG_VINDUE_MS = 90_000;

function nyligeOpslagsord(katalog: Kort[], states: Korttilstand[], now: Date): Set<string> {
  const kortById = new Map(katalog.map((kort) => [kort.id, kort]));
  const nylige = new Set<string>();
  for (const state of states) {
    if (!state.lastReviewedAt) continue;
    if (now.getTime() - Date.parse(state.lastReviewedAt) > NYLIG_VINDUE_MS) continue;
    const kort = kortById.get(state.cardId);
    if (kort) {
      nylige.add(kort.opslagsord.toLowerCase());
    }
  }
  return nylige;
}

export function vælgKort(katalog: Kort[], states: Korttilstand[], now: Date) {
  const stateMap = new Map(states.map((state) => [state.cardId, state]));
  const nylige = nyligeOpslagsord(katalog, states, now);

  const dueKort = katalog
    .filter((kort) => erDue(stateMap.get(kort.id), now))
    .sort((a, b) => {
      const aDue = Date.parse(stateMap.get(a.id)?.dueAt ?? "");
      const bDue = Date.parse(stateMap.get(b.id)?.dueAt ?? "");
      return aDue - bDue;
    });

  if (dueKort.length > 0) {
    const friskDue = dueKort.find((kort) => !nylige.has(kort.opslagsord.toLowerCase()));
    return friskDue ?? dueKort[0];
  }

  const nyeKort = katalog.filter((kort) => !stateMap.has(kort.id));

  if (nyeKort.length > 0) {
    const friske = nyeKort.filter((kort) => !nylige.has(kort.opslagsord.toLowerCase()));
    const kandidater = friske.length > 0 ? friske : nyeKort;
    return vægtetTilfældigt(kandidater, (kort) => frekvensVægt(kort.frekvens));
  }

  const friskeKatalog = katalog.filter((kort) => !nylige.has(kort.opslagsord.toLowerCase()));
  const fallback = friskeKatalog.length > 0 ? friskeKatalog : katalog;
  return vægtetTilfældigt(fallback, (kort) => frekvensVægt(kort.frekvens));
}

function bygStudieSnapshot(katalog: Kort[], progress: BrugerProgress, now: Date): StudieSnapshot {
  const states = Object.values(progress.kort);
  const dag = hentDag(progress, tilDatoNøgle(now));
  const kort = vælgKort(katalog, states, now);
  const eksisterende = progress.kort[kort.id] ?? nyKorttilstand(kort.id, now);
  const forhåndsState = planlægNæsteReview(kort.id, eksisterende, "correct", now);
  const næsteKort = vælgKort(
    katalog,
    Object.values({
      ...progress.kort,
      [kort.id]: forhåndsState,
    }),
    now,
  );

  return {
    kort,
    næsteKort,
    statistik: beregnStatistik(katalog, states, dag, now),
  };
}

type ForberedtReview = {
  snapshot: StudieSnapshot;
  gem: () => Promise<void>;
};

function beregnStatistik(
  katalog: Kort[],
  states: Korttilstand[],
  dag: { svar: number; rigtige: number; forkerte: number },
  now: Date,
): StudieStatistik {
  return {
    totalCards: katalog.length,
    setCards: states.filter((state) => state.seen > 0).length,
    modneCards: states.filter(erModent).length,
    dueToday: states.filter((state) => erDue(state, now)).length,
    svarIDag: dag.svar,
    rigtigeIDag: dag.rigtige,
    forkerteIDag: dag.forkerte,
  };
}

export async function hentStudieSnapshot(userId: string): Promise<StudieSnapshot> {
  const now = new Date();
  const [katalog, progress] = await Promise.all([hentKatalog(), hentProgressRepository().hent(userId)]);
  return bygStudieSnapshot(katalog, progress, now);
}

export async function hentStatistikOversigt(userId: string): Promise<StatistikOversigt> {
  const now = new Date();
  const [katalog, progress] = await Promise.all([hentKatalog(), hentProgressRepository().hent(userId)]);
  const states = Object.values(progress.kort);
  const dag = hentDag(progress, tilDatoNøgle(now));
  const dage = senesteDatoNøgler(30, now).map((dato) => hentDag(progress, dato));

  return {
    statistik: beregnStatistik(katalog, states, dag, now),
    dage,
  };
}

export async function forberedReview(
  userId: string,
  cardId: string,
  rating: ReviewRating,
): Promise<ForberedtReview> {
  const now = new Date();
  const repository = hentProgressRepository();
  const [katalog, progress] = await Promise.all([hentKatalog(), repository.hent(userId)]);
  const kort = katalog.find((item) => item.id === cardId);

  if (!kort) {
    throw new Error(`Ukendt kort: ${cardId}`);
  }

  const forrigeKort = progress.kort[cardId] ?? null;
  const eksisterende = forrigeKort ?? nyKorttilstand(cardId, now);
  const næsteState = planlægNæsteReview(cardId, eksisterende, rating, now);
  const dato = tilDatoNøgle(now);
  const forrigeDag = progress.dage[dato] ?? null;
  const dag = hentDag(progress, dato);
  const næsteDag = {
    dato,
    svar: dag.svar + 1,
    rigtige: dag.rigtige + (rating === "correct" ? 1 : 0),
    forkerte: dag.forkerte + (rating === "wrong" ? 1 : 0),
  };

  const event = {
    cardId,
    rating,
    reviewedAt: now.toISOString(),
    nextDueAt: næsteState.dueAt,
    forrigeKort,
    forrigeDag,
  };

  const snapshot = bygStudieSnapshot(
    katalog,
    {
      kort: { ...progress.kort, [cardId]: næsteState },
      dage: { ...progress.dage, [dato]: næsteDag },
    },
    now,
  );

  return {
    snapshot,
    gem: () => repository.gemReview(userId, næsteState, næsteDag, event),
  };
}

export async function registrerReview(
  userId: string,
  cardId: string,
  rating: ReviewRating,
): Promise<StudieSnapshot> {
  const review = await forberedReview(userId, cardId, rating);
  await review.gem();
  return review.snapshot;
}

export async function fortrydSidsteReview(userId: string): Promise<StudieSnapshot> {
  const resultat = await hentProgressRepository().fortrydSidsteReview(userId);
  if (!resultat) {
    throw new Error("Intet review at fortryde.");
  }
  return hentStudieSnapshot(userId);
}
