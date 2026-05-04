import { promises as fs } from "node:fs";

const ORDKLASSE_MAP = {
  noun: "substantiv",
  verb: "verbum",
  adjective: "adjektiv",
  adverb: "adverbium",
};

const DDO_ORDKLASSE_MAP = {
  "sb.": "substantiv",
  "vb.": "verbum",
  "adj.": "adjektiv",
  "adv.": "adverbium",
  "præp.": "præposition",
  "konj.": "konjunktion",
  "pron.": "pronomen",
  "interj.": "interjektion",
};

export function normaliserOrdklasse(pos) {
  return ORDKLASSE_MAP[pos] ?? pos;
}

export function normaliserDdoOrdklasse(pos) {
  if (!pos) return "";
  const trimmet = pos.trim().toLowerCase();
  return DDO_ORDKLASSE_MAP[trimmet] ?? trimmet;
}

export function trimDefinition(definition) {
  return (definition ?? "").replace(/\s+/g, " ").trim();
}

export function erAfkortetDefinition(definition) {
  return /(?:…|\.\.\.)\s*$/u.test(definition ?? "");
}

export function erUegnetSomFlashcard(form) {
  // Bundne morfemer: præfikser/suffikser som "anti-" eller "-agtig".
  if (form.startsWith("-") || form.endsWith("-")) {
    return true;
  }
  // DanNet bruger parenteser til at vise valgfrie ord eller varianter,
  // fx "(alment) praktiserende læge" eller "i (går) aftes". Det er
  // notation for ordbogen og duer ikke direkte som flashcard.
  if (/[()]/.test(form)) {
    return true;
  }
  // Ren-numeriske former som "117" er ikke et reelt opslagsord.
  if (/^\d+$/.test(form)) {
    return true;
  }
  // Ontologi-lækager fra DanNet ("1stOrder", "FirstOrderEntity") starter
  // med ciffer eller ASCII-CamelCase uden mellemrum og indeholder ingen
  // danske bogstaver eller bindestreger.
  if (/^[0-9]+[A-Za-z]*[A-Z][a-z]/.test(form)) {
    return true;
  }
  // Proprier (egennavne): stort begyndelsesbogstav efterfulgt af mindst ét
  // lille bogstav. Dækker fx "Polen", "Aarhus", "Puerto Rico", "Olsen".
  // Akronymer som "ED", "USA" og "VM-hold" har ikke lowercase efter den
  // første kapital og bliver derfor beholdt.
  if (/^[A-ZÆØÅ][a-zæøå]/u.test(form)) {
    return true;
  }
  return false;
}

export function parseFrekvensIndhold(content) {
  const map = new Map();
  for (const line of content.split(/\r?\n/)) {
    if (!line) continue;
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    const lemma = parts[1].trim().toLowerCase();
    const frekvens = Number(parts[2]);
    if (!lemma || !Number.isFinite(frekvens)) continue;
    const eksisterende = map.get(lemma);
    if (eksisterende === undefined || frekvens > eksisterende) {
      map.set(lemma, frekvens);
    }
  }
  return map;
}

export async function indlæsFrekvens(file) {
  let content;
  try {
    content = await fs.readFile(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn(`Frekvensfil mangler (${file}). Kort får ingen frekvens.`);
      return new Map();
    }
    throw error;
  }
  return parseFrekvensIndhold(content);
}

function ddoNoegle(opslagsord, ordklasse) {
  return `${opslagsord.trim().toLowerCase()}|${normaliserDdoOrdklasse(ordklasse)}`;
}

// DDO-lemma TSV: opslagsord<TAB>homograf<TAB>ordklasse<TAB>ddo-id
// Returnerer en Map keyed on `${lemma}|${ordklasse-på-dansk}` -> ddoId.
// Hvis flere homografer deler samme nøgle, vinder den med laveste homograf-nr
// (typisk den primære).
export function parseDdoLemmaer(content) {
  const map = new Map();
  for (const line of content.split(/\r?\n/)) {
    if (!line) continue;
    const parts = line.split("\t");
    if (parts.length < 4) continue;
    const [opslagsord, homograf, ordklasse, ddoId] = parts;
    if (!opslagsord || !ddoId || !/^\d+$/.test(ddoId.trim())) continue;
    const key = ddoNoegle(opslagsord, ordklasse);
    const homografNr = Number.parseInt(homograf, 10);
    const eksisterende = map.get(key);
    if (
      !eksisterende ||
      (Number.isFinite(homografNr) && homografNr < eksisterende.homograf)
    ) {
      map.set(key, {
        ddoId: ddoId.trim(),
        homograf: Number.isFinite(homografNr) ? homografNr : Number.POSITIVE_INFINITY,
      });
    }
  }
  const flad = new Map();
  for (const [key, value] of map) {
    flad.set(key, value.ddoId);
  }
  return flad;
}

// DDO-fullform TSV: bøjningsform<TAB>opslagsform<TAB>homograf<TAB>ordklasse<TAB>ddo-id
// Returnerer en liste {form, opslagsform, ordklasse, ddoId}.
export function parseDdoFullformer(content) {
  const rows = [];
  for (const line of content.split(/\r?\n/)) {
    if (!line) continue;
    const parts = line.split("\t");
    if (parts.length < 5) continue;
    const [form, opslagsform, , ordklasse, ddoId] = parts;
    if (!form || !opslagsform || !ddoId || !/^\d+$/.test(ddoId.trim())) continue;
    rows.push({
      form: form.trim(),
      opslagsform: opslagsform.trim(),
      ordklasse: normaliserDdoOrdklasse(ordklasse),
      ddoId: ddoId.trim(),
    });
  }
  return rows;
}

export function ddoLookup(ddoMap, opslagsord, ordklasse) {
  return ddoMap.get(`${opslagsord.trim().toLowerCase()}|${ordklasse}`);
}

export function parseCsvLine(line) {
  const values = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      values.push(value);
      value = "";
    } else {
      value += char;
    }
  }

  values.push(value);
  return values;
}
