import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import {
  ddoLookup,
  erAfkortetDefinition,
  erUegnetSomFlashcard,
  indlæsFrekvens,
  normaliserOrdklasse,
  parseCsvLine,
  parseDdoFullformer,
  parseDdoLemmaer,
  trimDefinition,
} from "./import-helpers.mjs";

const DEFAULT_SOURCE = "C:\\tmp\\ord-dsl\\dannet-csv";
const DEFAULT_TARGET = path.join(process.cwd(), "public", "katalog", "v1");
const DEFAULT_FREKVENS = "C:\\tmp\\ord-dsl\\freq\\lemma-30k-2017.txt";
const SHARD_SIZE = 500;

function parseArgs(argv) {
  const args = {
    source: DEFAULT_SOURCE,
    target: DEFAULT_TARGET,
    frekvens: DEFAULT_FREKVENS,
    ddoLemmaer: null,
    ddoFuldformer: null,
    limit: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source") {
      args.source = argv[++i];
    } else if (arg === "--target") {
      args.target = argv[++i];
    } else if (arg === "--frekvens") {
      args.frekvens = argv[++i];
    } else if (arg === "--ddo-lemmaer") {
      args.ddoLemmaer = argv[++i];
    } else if (arg === "--ddo-fuldformer") {
      args.ddoFuldformer = argv[++i];
    } else if (arg === "--limit") {
      args.limit = Number(argv[++i]);
    } else {
      throw new Error(`Ukendt argument: ${arg}`);
    }
  }

  return args;
}

async function indlæsValgfriTekstfil(file, label) {
  if (!file) return null;
  try {
    return await fs.readFile(path.resolve(file), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn(`${label} mangler (${file}). Kataloget bygges uden ${label}.`);
      return null;
    }
    throw error;
  }
}

async function readCsv(file) {
  const content = await fs.readFile(file, "utf8");
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseCsvLine);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = path.resolve(args.source);
  const target = path.resolve(args.target);

  const [
    wordRows,
    senseRows,
    synsetRows,
    exampleRows,
    frekvensMap,
    ddoLemmaerIndhold,
    ddoFuldformerIndhold,
  ] = await Promise.all([
    readCsv(path.join(source, "words.csv")),
    readCsv(path.join(source, "senses.csv")),
    readCsv(path.join(source, "synsets.csv")),
    readCsv(path.join(source, "examples.csv")),
    indlæsFrekvens(path.resolve(args.frekvens)),
    indlæsValgfriTekstfil(args.ddoLemmaer, "DDO-lemmaliste"),
    indlæsValgfriTekstfil(args.ddoFuldformer, "DDO-fuldformsliste"),
  ]);

  const ddoMap = ddoLemmaerIndhold ? parseDdoLemmaer(ddoLemmaerIndhold) : new Map();
  const ddoFuldformer = ddoFuldformerIndhold ? parseDdoFullformer(ddoFuldformerIndhold) : [];

  const words = new Map(
    wordRows
      .map(([wordId, form, pos]) => [
        wordId,
        {
          form: (form ?? "").trim(),
          pos,
        },
      ])
      .filter(([, word]) => word.form.length > 0)
      .filter(([, word]) => !erUegnetSomFlashcard(word.form)),
  );
  const synsets = new Map(
    synsetRows.map(([synsetId, definition]) => [synsetId, trimDefinition(definition ?? "")]),
  );
  const examples = new Map();

  for (const [senseId, example] of exampleRows) {
    if (!examples.has(senseId)) {
      examples.set(senseId, []);
    }
    examples.get(senseId).push(example);
  }

  const cards = [];
  for (const [senseId, synsetId, wordId] of senseRows) {
    const word = words.get(wordId);
    const definition = synsets.get(synsetId);

    if (!word || !definition) {
      continue;
    }

    const frekvens = frekvensMap.get(word.form.toLowerCase());
    const ordklasse = normaliserOrdklasse(word.pos);
    const ddoId = ddoLookup(ddoMap, word.form, ordklasse);

    cards.push({
      id: senseId,
      opslagsord: word.form,
      ordklasse,
      definition,
      eksempler: (examples.get(senseId) ?? []).slice(0, 2),
      kilde: "DanNet",
      senseId,
      synsetId,
      afkortet: erAfkortetDefinition(definition),
      ...(frekvens !== undefined ? { frekvens } : {}),
      ...(ddoId ? { ddoId } : {}),
    });
  }

  cards.sort((a, b) => a.opslagsord.localeCompare(b.opslagsord, "da"));
  const limitedCards = args.limit ? cards.slice(0, args.limit) : cards;
  await fs.rm(target, { recursive: true, force: true });
  await fs.mkdir(target, { recursive: true });

  const shards = [];
  for (let i = 0; i < limitedCards.length; i += SHARD_SIZE) {
    const shardCards = limitedCards.slice(i, i + SHARD_SIZE);
    const file = `shards/${String(shards.length).padStart(4, "0")}.json`;
    const shardPath = path.join(target, file);
    await fs.mkdir(path.dirname(shardPath), { recursive: true });
    await fs.writeFile(shardPath, `${JSON.stringify(shardCards)}\n`, "utf8");
    shards.push({ file, count: shardCards.length });
  }

  const truncatedCards = limitedCards.filter((kort) => kort.afkortet).length;
  const rangeredeCards = limitedCards.filter((kort) => typeof kort.frekvens === "number").length;
  const ddoMatchede = limitedCards.filter((kort) => typeof kort.ddoId === "string").length;

  if (ddoFuldformer.length > 0) {
    await fs.writeFile(
      path.join(target, "fuldformer.json"),
      `${JSON.stringify(ddoFuldformer)}\n`,
      "utf8",
    );
  }

  const manifest = {
    version: "v1",
    generatedAt: new Date().toISOString(),
    source: "DanNet CSV",
    totalCards: limitedCards.length,
    truncatedCards,
    rangeredeCards,
    ddoMatchede,
    fuldformer: ddoFuldformer.length,
    shards,
    attribution: {
      title: "DanNet",
      license: "CC BY-SA 4.0",
      url: "https://wordnet.dk/dannet/data",
    },
    frekvensKilde:
      rangeredeCards > 0
        ? {
            title: "30.000 hyppigste danske lemmaer (2017)",
            license: "DSL Åben Licens",
            url: "https://sprogteknologi.dk/dataset/10-000-mest-frekvente-lemmaer",
          }
        : null,
    ddoKilde:
      ddoMatchede > 0 || ddoFuldformer.length > 0
        ? {
            title: "Den Danske Ordbog – lemma- og fuldformsliste",
            license: "DSL Åben Licens",
            url: "https://korpus.dsl.dk/resources/details/ddo-lemmas.html",
          }
        : null,
  };

  await fs.writeFile(path.join(target, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(
    `Skrev ${limitedCards.length} kort til ${target} (${rangeredeCards} med frekvens, ${ddoMatchede} med DDO-id, ${truncatedCards} afkortede, ${ddoFuldformer.length} fuldformer).`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
