import { hentKatalog } from "@/lib/catalog";
import { senesteDatoNøgler, tilDatoNøgle } from "@/lib/date";
import { hentDag, hentProgressRepository } from "@/lib/progress";
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

export function vælgKort(katalog: Kort[], states: Korttilstand[], now: Date) {
  const stateMap = new Map(states.map((state) => [state.cardId, state]));
  const dueKort = katalog
    .filter((kort) => erDue(stateMap.get(kort.id), now))
    .sort((a, b) => {
      const aDue = Date.parse(stateMap.get(a.id)?.dueAt ?? "");
      const bDue = Date.parse(stateMap.get(b.id)?.dueAt ?? "");
      return aDue - bDue;
    });

  if (dueKort[0]) {
    return dueKort[0];
  }

  const nyeKort = katalog.filter((kort) => !stateMap.has(kort.id));
  if (nyeKort.length > 0) {
    return vægtetTilfældigt(nyeKort, (kort) => frekvensVægt(kort.frekvens));
  }

  return vægtetTilfældigt(katalog, (kort) => frekvensVægt(kort.frekvens));
}

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
  const states = Object.values(progress.kort);
  const dag = hentDag(progress, tilDatoNøgle(now));
  const kort = vælgKort(katalog, states, now);

  return {
    kort,
    statistik: beregnStatistik(katalog, states, dag, now),
  };
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

export async function registrerReview(
  userId: string,
  cardId: string,
  rating: ReviewRating,
): Promise<StudieSnapshot> {
  const now = new Date();
  const [katalog, progress] = await Promise.all([hentKatalog(), hentProgressRepository().hent(userId)]);
  const kort = katalog.find((item) => item.id === cardId);

  if (!kort) {
    throw new Error(`Ukendt kort: ${cardId}`);
  }

  const eksisterende = progress.kort[cardId] ?? nyKorttilstand(cardId, now);
  const næsteState = planlægNæsteReview(cardId, eksisterende, rating, now);
  const dato = tilDatoNøgle(now);
  const dag = hentDag(progress, dato);
  const næsteDag = {
    dato,
    svar: dag.svar + 1,
    rigtige: dag.rigtige + (rating === "correct" ? 1 : 0),
    forkerte: dag.forkerte + (rating === "wrong" ? 1 : 0),
  };

  await hentProgressRepository().gemReview(userId, næsteState, næsteDag, {
    cardId,
    rating,
    reviewedAt: now.toISOString(),
    nextDueAt: næsteState.dueAt,
  });

  return hentStudieSnapshot(userId);
}
