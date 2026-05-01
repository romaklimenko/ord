import { lægDageTil } from "@/lib/date";
import type { Korttilstand, ReviewRating } from "@/lib/types";

const MIN_EASE = 1.3;
const START_EASE = 2.5;

export function nyKorttilstand(cardId: string, now = new Date()): Korttilstand {
  return {
    cardId,
    repetitions: 0,
    easeFactor: START_EASE,
    intervalDays: 0,
    dueAt: now.toISOString(),
    seen: 0,
    correct: 0,
    wrong: 0,
  };
}

export function planlægNæsteReview(
  cardId: string,
  eksisterende: Korttilstand | undefined,
  rating: ReviewRating,
  now = new Date(),
): Korttilstand {
  const state = eksisterende ?? nyKorttilstand(cardId, now);
  const korrekt = rating === "correct";
  const quality = korrekt ? 5 : 2;
  const easeFactor = Math.max(
    MIN_EASE,
    state.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  const repetitions = korrekt ? state.repetitions + 1 : 0;
  let intervalDays = 1;

  if (korrekt && repetitions === 2) {
    intervalDays = 6;
  } else if (korrekt && repetitions > 2) {
    intervalDays = Math.max(1, Math.round(state.intervalDays * easeFactor));
  }

  return {
    ...state,
    cardId,
    repetitions,
    easeFactor,
    intervalDays,
    dueAt: lægDageTil(now, intervalDays).toISOString(),
    lastReviewedAt: now.toISOString(),
    seen: state.seen + 1,
    correct: state.correct + (korrekt ? 1 : 0),
    wrong: state.wrong + (korrekt ? 0 : 1),
  };
}
