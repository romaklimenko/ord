import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { hentProgressRepository } from "@/lib/progress";

let arbejdsmappe: string;
let originalCwd: string;

beforeEach(async () => {
  originalCwd = process.cwd();
  arbejdsmappe = await fs.mkdtemp(path.join(os.tmpdir(), "ord-progress-test-"));
  process.chdir(arbejdsmappe);
});

afterEach(async () => {
  process.chdir(originalCwd);
  await fs.rm(arbejdsmappe, { recursive: true, force: true });
});

describe("FilProgressRepository.fortrydSidsteReview", () => {
  it("gendanner kort- og dagstilstand til før reviewet", async () => {
    const repo = hentProgressRepository();

    const stateEfter = {
      cardId: "kort-1",
      repetitions: 1,
      easeFactor: 2.6,
      intervalDays: 1,
      dueAt: "2026-05-05T10:00:00.000Z",
      lastReviewedAt: "2026-05-04T10:00:00.000Z",
      seen: 1,
      correct: 1,
      wrong: 0,
    };

    await repo.gemReview(
      "user-1",
      stateEfter,
      { dato: "20260504", svar: 1, rigtige: 1, forkerte: 0 },
      {
        cardId: "kort-1",
        rating: "correct",
        reviewedAt: "2026-05-04T10:00:00.000Z",
        nextDueAt: stateEfter.dueAt,
        forrigeKort: null,
        forrigeDag: null,
      },
    );

    const efterFørste = await repo.hent("user-1");
    expect(efterFørste.kort["kort-1"].seen).toBe(1);
    expect(efterFørste.dage["20260504"].svar).toBe(1);

    const resultat = await repo.fortrydSidsteReview("user-1");
    expect(resultat).toEqual({ cardId: "kort-1" });

    const efterFortryd = await repo.hent("user-1");
    expect(efterFortryd.kort["kort-1"]).toBeUndefined();
    expect(efterFortryd.dage["20260504"]).toBeUndefined();
  });

  it("returnerer null når der ikke er noget at fortryde", async () => {
    const repo = hentProgressRepository();
    expect(await repo.fortrydSidsteReview("user-2")).toBeNull();
  });

  it("bevarer korpus-snapshot-felterne på dag-rækken", async () => {
    const repo = hentProgressRepository();
    const stateEfter = {
      cardId: "kort-9",
      repetitions: 1,
      easeFactor: 2.6,
      intervalDays: 1,
      dueAt: "2026-05-05T10:00:00.000Z",
      lastReviewedAt: "2026-05-04T10:00:00.000Z",
      seen: 1,
      correct: 1,
      wrong: 0,
    };

    await repo.gemReview(
      "user-snapshot",
      stateEfter,
      {
        dato: "20260504",
        svar: 1,
        rigtige: 1,
        forkerte: 0,
        kortIAlt: 100,
        setCards: 12,
        modneCards: 3,
        tilRepetition: 4,
      },
      {
        cardId: "kort-9",
        rating: "correct",
        reviewedAt: "2026-05-04T10:00:00.000Z",
        nextDueAt: stateEfter.dueAt,
        forrigeKort: null,
        forrigeDag: null,
      },
    );

    const efter = await repo.hent("user-snapshot");
    expect(efter.dage["20260504"]).toEqual({
      dato: "20260504",
      svar: 1,
      rigtige: 1,
      forkerte: 0,
      kortIAlt: 100,
      setCards: 12,
      modneCards: 3,
      tilRepetition: 4,
    });
  });

  it("gendanner præcis tidligere tilstand når kortet allerede var set", async () => {
    const repo = hentProgressRepository();

    const førsteState = {
      cardId: "kort-2",
      repetitions: 1,
      easeFactor: 2.6,
      intervalDays: 1,
      dueAt: "2026-05-04T10:00:00.000Z",
      lastReviewedAt: "2026-05-03T10:00:00.000Z",
      seen: 1,
      correct: 1,
      wrong: 0,
    };
    const førsteDag = { dato: "20260503", svar: 1, rigtige: 1, forkerte: 0 };

    await repo.gemReview("user-3", førsteState, førsteDag, {
      cardId: "kort-2",
      rating: "correct",
      reviewedAt: "2026-05-03T10:00:00.000Z",
      nextDueAt: førsteState.dueAt,
      forrigeKort: null,
      forrigeDag: null,
    });

    // Andet review samme dag
    const andetState = {
      cardId: "kort-2",
      repetitions: 2,
      easeFactor: 2.7,
      intervalDays: 6,
      dueAt: "2026-05-10T10:00:00.000Z",
      lastReviewedAt: "2026-05-03T11:00:00.000Z",
      seen: 2,
      correct: 2,
      wrong: 0,
    };
    const andetDag = { dato: "20260503", svar: 2, rigtige: 2, forkerte: 0 };

    await repo.gemReview("user-3", andetState, andetDag, {
      cardId: "kort-2",
      rating: "correct",
      reviewedAt: "2026-05-03T11:00:00.000Z",
      nextDueAt: andetState.dueAt,
      forrigeKort: førsteState,
      forrigeDag: førsteDag,
    });

    const efterAndet = await repo.hent("user-3");
    expect(efterAndet.kort["kort-2"].seen).toBe(2);
    expect(efterAndet.dage["20260503"].svar).toBe(2);

    await repo.fortrydSidsteReview("user-3");

    const efterFortryd = await repo.hent("user-3");
    expect(efterFortryd.kort["kort-2"]).toEqual(førsteState);
    expect(efterFortryd.dage["20260503"]).toEqual(førsteDag);
  });

});
