import { afterEach, describe, expect, it, vi } from "vitest";
import { vælgKort } from "@/lib/study";
import type { Kort, Korttilstand } from "@/lib/types";

function kort(id: string, opslagsord: string, frekvens?: number): Kort {
  return {
    id,
    opslagsord,
    ordklasse: "substantiv",
    definition: "test",
    eksempler: [],
    kilde: "DanNet",
    ...(frekvens !== undefined ? { frekvens } : {}),
  };
}

function tilstand(cardId: string, lastReviewedAt: string): Korttilstand {
  return {
    cardId,
    repetitions: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    dueAt: "2099-01-01T00:00:00.000Z",
    lastReviewedAt,
    seen: 1,
    correct: 0,
    wrong: 0,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("vælgKort", () => {
  it("undgår at vælge nyt kort med samme opslagsord som lige er gennemset", () => {
    const now = new Date("2026-05-01T10:00:00.000Z");
    const katalog = [
      kort("a1", "være", 0.03),
      kort("a2", "være", 0.03),
      kort("b1", "have", 0.014),
    ];
    const states = [tilstand("a1", "2026-05-01T09:59:30.000Z")];

    vi.spyOn(Math, "random").mockReturnValue(0);

    const valg = vælgKort(katalog, states, now);
    expect(valg.opslagsord).toBe("have");
  });

  it("falder tilbage til alle nye kort, hvis nylig-filteret tømmer kandidatpuljen", () => {
    const now = new Date("2026-05-01T10:00:00.000Z");
    const katalog = [kort("a1", "være", 0.03), kort("a2", "være", 0.03)];
    const states = [tilstand("a1", "2026-05-01T09:59:30.000Z")];

    vi.spyOn(Math, "random").mockReturnValue(0);

    const valg = vælgKort(katalog, states, now);
    expect(valg.opslagsord).toBe("være");
  });

  it("ignorerer reviews ældre end nylig-vinduet", () => {
    const now = new Date("2026-05-01T10:00:00.000Z");
    // a1 og b1 har samme opslagsord "kage". a1's review er gammel (> 90s)
    // og bør derfor ikke filtrere b1 væk, selvom de deler opslagsord.
    const katalog = [
      kort("a1", "kage", 1e-3),
      kort("b1", "kage", 1e-3),
      kort("c1", "smør", 1e-3),
    ];
    const states = [tilstand("a1", "2026-05-01T09:55:00.000Z")];

    vi.spyOn(Math, "random").mockReturnValue(0);

    const valg = vælgKort(katalog, states, now);
    expect(valg.id).toBe("b1");
  });
});
