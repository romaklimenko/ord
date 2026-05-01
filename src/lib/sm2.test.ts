import { describe, expect, it } from "vitest";
import { nyKorttilstand, planlægNæsteReview } from "@/lib/sm2";

describe("SM-2-planlægning", () => {
  it("lægger et korrekt nyt kort til repetition i morgen", () => {
    const now = new Date("2026-05-01T10:00:00.000Z");
    const state = nyKorttilstand("kort-1", now);

    const næste = planlægNæsteReview("kort-1", state, "correct", now);

    expect(næste.repetitions).toBe(1);
    expect(næste.intervalDays).toBe(1);
    expect(næste.correct).toBe(1);
    expect(næste.dueAt).toBe("2026-05-02T10:00:00.000Z");
  });

  it("nulstiller repetitioner ved forkert svar", () => {
    const now = new Date("2026-05-01T10:00:00.000Z");
    const state = {
      ...nyKorttilstand("kort-1", now),
      repetitions: 3,
      intervalDays: 12,
    };

    const næste = planlægNæsteReview("kort-1", state, "wrong", now);

    expect(næste.repetitions).toBe(0);
    expect(næste.intervalDays).toBe(1);
    expect(næste.wrong).toBe(1);
    expect(næste.easeFactor).toBeLessThan(state.easeFactor);
  });
});
