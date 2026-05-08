import { describe, expect, it } from "vitest";
import {
  ddoLookup,
  erAfkortetDefinition,
  erUegnetSomFlashcard,
  normaliserDdoOrdklasse,
  normaliserOrdklasse,
  parseCsvLine,
  parseDdoFullformer,
  parseDdoLemmaer,
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

  it("kasserer enkeltbogstavs-former", () => {
    expect(erUegnetSomFlashcard("a")).toBe(true);
    expect(erUegnetSomFlashcard("ø")).toBe(true);
    expect(erUegnetSomFlashcard(" b ")).toBe(true);
  });

  it("kasserer rene tal", () => {
    expect(erUegnetSomFlashcard("117")).toBe(true);
    expect(erUegnetSomFlashcard("0")).toBe(true);
  });

  it("kasserer ontologi-lækager fra DanNet", () => {
    expect(erUegnetSomFlashcard("1stOrder")).toBe(true);
  });

  it("beholder formede tal-ord og bindestregsformer", () => {
    expect(erUegnetSomFlashcard("13-tal")).toBe(false);
    expect(erUegnetSomFlashcard("1. reservelæge")).toBe(false);
    expect(erUegnetSomFlashcard("26-tommers")).toBe(false);
  });

  it("kasserer proprier (egennavne)", () => {
    expect(erUegnetSomFlashcard("Polen")).toBe(true);
    expect(erUegnetSomFlashcard("Aarhus")).toBe(true);
    expect(erUegnetSomFlashcard("Puerto Rico")).toBe(true);
    expect(erUegnetSomFlashcard("Olsen")).toBe(true);
    expect(erUegnetSomFlashcard("Nørre Broby")).toBe(true);
  });

  it("beholder akronymer og forkortelser", () => {
    expect(erUegnetSomFlashcard("ED")).toBe(false);
    expect(erUegnetSomFlashcard("USA")).toBe(false);
    expect(erUegnetSomFlashcard("VM-hold")).toBe(false);
    expect(erUegnetSomFlashcard("A-officer")).toBe(false);
    expect(erUegnetSomFlashcard("PMV")).toBe(false);
  });

  it("beholder danske ord der starter med ø/æ/å", () => {
    expect(erUegnetSomFlashcard("økologisk")).toBe(false);
    expect(erUegnetSomFlashcard("æggestand")).toBe(false);
    expect(erUegnetSomFlashcard("ødeland")).toBe(false);
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

describe("normaliserDdoOrdklasse", () => {
  it("oversætter DDO-forkortelser til danske fulde navne", () => {
    expect(normaliserDdoOrdklasse("sb.")).toBe("substantiv");
    expect(normaliserDdoOrdklasse("vb.")).toBe("verbum");
    expect(normaliserDdoOrdklasse("adj.")).toBe("adjektiv");
    expect(normaliserDdoOrdklasse("adv.")).toBe("adverbium");
  });

  it("returnerer ukendte forkortelser i lowercase", () => {
    expect(normaliserDdoOrdklasse("XYZ")).toBe("xyz");
  });

  it("håndterer tom input uden at kaste", () => {
    expect(normaliserDdoOrdklasse("")).toBe("");
    expect(normaliserDdoOrdklasse(undefined)).toBe("");
  });
});

describe("parseDdoLemmaer", () => {
  it("læser opslagsord, ordklasse og DDO-id fra TSV", () => {
    const map = parseDdoLemmaer("kage\t1\tsb.\t11034567\nvære\t1\tvb.\t11098765\n");
    expect(ddoLookup(map, "kage", "substantiv")).toBe("11034567");
    expect(ddoLookup(map, "være", "verbum")).toBe("11098765");
  });

  it("foretrækker laveste homograf-nummer når flere matcher", () => {
    const map = parseDdoLemmaer("kage\t2\tsb.\t99999999\nkage\t1\tsb.\t11034567\n");
    expect(ddoLookup(map, "kage", "substantiv")).toBe("11034567");
  });

  it("springer linjer uden gyldigt DDO-id over", () => {
    const map = parseDdoLemmaer("kage\t1\tsb.\tikke-et-tal\nvære\t1\tvb.\t11098765\n");
    expect(ddoLookup(map, "kage", "substantiv")).toBeUndefined();
    expect(ddoLookup(map, "være", "verbum")).toBe("11098765");
  });
});

describe("parseDdoFullformer", () => {
  it("returnerer alle bøjningsformer med tilknyttet opslagsform og DDO-id", () => {
    const rows = parseDdoFullformer(
      "kage\tkage\t1\tsb.\t11034567\nkagen\tkage\t1\tsb.\t11034567\nkager\tkage\t1\tsb.\t11034567\n",
    );
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      form: "kage",
      opslagsform: "kage",
      ordklasse: "substantiv",
      ddoId: "11034567",
    });
    expect(rows[1].form).toBe("kagen");
  });

  it("springer ufuldstændige linjer over", () => {
    const rows = parseDdoFullformer(
      "kage\tkage\t1\tsb.\t11034567\nbroken-line\nkagen\tkage\t1\tsb.\t11034567\n",
    );
    expect(rows).toHaveLength(2);
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
