import { describe, expect, it } from "vitest";
import { frekvensVægt, vægtetTilfældigt } from "@/lib/vaelg";

describe("vægtetTilfældigt", () => {
  it("vælger tungt vægtet element ved midten af tilfældigheden", () => {
    const valg = vægtetTilfældigt(
      [
        { id: "a", v: 0.9 },
        { id: "b", v: 0.1 },
      ],
      (item) => item.v,
      () => 0.5,
    );

    expect(valg.id).toBe("a");
  });

  it("vælger let vægtet element når tilfældigheden ligger sent", () => {
    const valg = vægtetTilfældigt(
      [
        { id: "a", v: 0.9 },
        { id: "b", v: 0.1 },
      ],
      (item) => item.v,
      () => 0.95,
    );

    expect(valg.id).toBe("b");
  });

  it("falder tilbage til uniform når alle vægte er nul", () => {
    const valg = vægtetTilfældigt(
      [
        { id: "a", v: 0 },
        { id: "b", v: 0 },
      ],
      (item) => item.v,
      () => 0.5,
    );

    expect(valg.id).toBe("b");
  });
});

describe("frekvensVægt", () => {
  it("giver et lille gulv til kort uden frekvens", () => {
    expect(frekvensVægt(undefined)).toBeGreaterThan(0);
  });

  it("giver et fælles gulv så alle ord-uden-rang får samme vægt", () => {
    expect(frekvensVægt(undefined)).toBe(frekvensVægt(undefined));
  });

  it("giver højfrekvente ord en større vægt end lavfrekvente", () => {
    expect(frekvensVægt(0.03)).toBeGreaterThan(frekvensVægt(1e-7));
  });
});
