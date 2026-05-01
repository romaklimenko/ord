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

function tilstand(
  cardId: string,
  lastReviewedAt: string,
  options: { dueAt?: string } = {},
): Korttilstand {
  return {
    cardId,
    repetitions: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    dueAt: options.dueAt ?? "2099-01-01T00:00:00.000Z",
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

  it("foretrækker due-kort hvis opslagsord ikke er nyligt set", () => {
    const now = new Date("2026-05-01T10:00:00.000Z");
    const katalog = [kort("a1", "være"), kort("a2", "være"), kort("b1", "have")];
    const states = [
      // a1 lige gennemset → opslagsord "være" er nyligt
      tilstand("a1", "2026-05-01T09:59:30.000Z", { dueAt: "2026-04-30T00:00:00.000Z" }),
      // a2 og b1 er begge due, men a2 deler opslagsord med a1
      tilstand("a2", "2026-04-30T00:00:00.000Z", { dueAt: "2026-04-30T00:00:00.000Z" }),
      tilstand("b1", "2026-04-30T00:00:00.000Z", { dueAt: "2026-04-30T05:00:00.000Z" }),
    ];

    const valg = vælgKort(katalog, states, now);
    expect(valg.id).toBe("b1");
  });

  it("falder tilbage til mest-due hvis alle due-kort er nylige", () => {
    const now = new Date("2026-05-01T10:00:00.000Z");
    const katalog = [kort("a1", "være"), kort("a2", "være")];
    const states = [
      // Begge er due, og begge har samme opslagsord, så nylig-filteret
      // tømmer kandidatpuljen. Vi skal ramme mest-due (tidligst dueAt).
      tilstand("a1", "2026-05-01T09:59:30.000Z", { dueAt: "2026-04-30T00:00:00.000Z" }),
      tilstand("a2", "2026-05-01T09:59:45.000Z", { dueAt: "2026-04-30T05:00:00.000Z" }),
    ];

    const valg = vælgKort(katalog, states, now);
    expect(valg.id).toBe("a1");
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
