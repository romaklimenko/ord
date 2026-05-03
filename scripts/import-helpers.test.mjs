import { describe, expect, it } from "vitest";
import {
  erAfkortetDefinition,
  erUegnetSomFlashcard,
  normaliserOrdklasse,
  parseCsvLine,
  parseFrekvensIndhold,
  trimDefinition,
} from "./import-helpers.mjs";

describe("normaliserOrdklasse", () => {
  it("oversætter de fire grundklasser til dansk", () => {
    expect(normaliserOrdklasse("noun")).toBe("substantiv");
    expect(normaliserOrdklasse("verb")).toBe("verbum");
    expect(normaliserOrdklasse("adjective")).toBe("adjektiv");
    expect(normaliserOrdklasse("adverb")).toBe("adverbium");
  });

  it("returnerer ukendte klasser uændret", () => {
    expect(normaliserOrdklasse("interjection")).toBe("interjection");
  });
});

describe("trimDefinition", () => {
  it("normaliserer whitespace", () => {
    expect(trimDefinition("  noget   med    flere   mellemrum  ")).toBe(
      "noget med flere mellemrum",
    );
  });

  it("håndterer null og undefined uden at kaste", () => {
    expect(trimDefinition(undefined)).toBe("");
    expect(trimDefinition(null)).toBe("");
  });
});

describe("erAfkortetDefinition", () => {
  it("genkender ellipse-tegnet", () => {
    expect(erAfkortetDefinition("noget der slutter med …")).toBe(true);
  });

  it("genkender tre punktummer", () => {
    expect(erAfkortetDefinition("noget der slutter med ...")).toBe(true);
  });

  it("returnerer false for fulde definitioner", () => {
    expect(erAfkortetDefinition("en kort men fuld definition")).toBe(false);
  });

  it("ignorerer punktummer midt i teksten", () => {
    expect(erAfkortetDefinition("noget med ... midt i teksten og slut")).toBe(false);
  });
});

describe("erUegnetSomFlashcard", () => {
  it("kasserer bundne præfikser", () => {
    expect(erUegnetSomFlashcard("anti-")).toBe(true);
    expect(erUegnetSomFlashcard("kemo-")).toBe(true);
  });

  it("kasserer bundne suffikser", () => {
    expect(erUegnetSomFlashcard("-agtig")).toBe(true);
    expect(erUegnetSomFlashcard("-værn")).toBe(true);
  });

  it("kasserer parentesnotation", () => {
    expect(erUegnetSomFlashcard("(alment) praktiserende læge")).toBe(true);
    expect(erUegnetSomFlashcard("i (går) aftes")).toBe(true);
  });

  it("beholder almindelige ord", () => {
    expect(erUegnetSomFlashcard("kage")).toBe(false);
    expect(erUegnetSomFlashcard("praktiserende læge")).toBe(false);
    expect(erUegnetSomFlashcard("vandtæt")).toBe(false);
  });
});

describe("parseFrekvensIndhold", () => {
  it("læser POS-lemma-frekvens linjer", () => {
    const map = parseFrekvensIndhold("V\tvære\t0.03\nNC\tkage\t0.0001\n");
    expect(map.get("være")).toBe(0.03);
    expect(map.get("kage")).toBe(0.0001);
  });

  it("vælger den højeste frekvens når et lemma optræder flere gange", () => {
    const map = parseFrekvensIndhold("NC\tløb\t0.0002\nV\tløb\t0.001\n");
    expect(map.get("løb")).toBe(0.001);
  });

  it("normaliserer lemmaer til lowercase", () => {
    const map = parseFrekvensIndhold("NP\tDanmark\t0.005\n");
    expect(map.get("danmark")).toBe(0.005);
  });

  it("springer korrupte linjer over", () => {
    const map = parseFrekvensIndhold(
      "ikke-tab-separeret-linje\nV\tvære\tikke-et-tal\nV\tkomme\t0.02\n\n",
    );
    expect(map.has("være")).toBe(false);
    expect(map.get("komme")).toBe(0.02);
  });
});

describe("parseCsvLine", () => {
  it("splitter på komma", () => {
    expect(parseCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("respekterer citationstegn rundt om felter med komma", () => {
    expect(parseCsvLine('synset-1,"stor, sammenhængende masse",Kategori')).toEqual([
      "synset-1",
      "stor, sammenhængende masse",
      "Kategori",
    ]);
  });

  it("håndterer escaped citationstegn", () => {
    expect(parseCsvLine('id,"han sagde ""nej""",rest')).toEqual([
      "id",
      'han sagde "nej"',
      "rest",
    ]);
  });
});
