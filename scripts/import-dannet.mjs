import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

const DEFAULT_SOURCE = "C:\\tmp\\ord-dsl\\dannet-csv";
const DEFAULT_TARGET = path.join(process.cwd(), "public", "katalog", "v1");
const SHARD_SIZE = 500;

function parseArgs(argv) {
  const args = {
    source: DEFAULT_SOURCE,
    target: DEFAULT_TARGET,
    limit: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--source") {
      args.source = argv[++i];
    } else if (arg === "--target") {
      args.target = argv[++i];
    } else if (arg === "--limit") {
      args.limit = Number(argv[++i]);
    } else {
      throw new Error(`Ukendt argument: ${arg}`);
    }
  }

  return args;
}

function parseCsvLine(line) {
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

async function readCsv(file) {
  const content = await fs.readFile(file, "utf8");
  return content
    .split(/\r?\n/)
    .filter(Boolean)
    .map(parseCsvLine);
}

function normaliserOrdklasse(pos) {
  const map = {
    noun: "substantiv",
    verb: "verbum",
    adjective: "adjektiv",
    adverb: "adverbium",
  };

  return map[pos] ?? pos;
}

function trimDefinition(definition) {
  return definition.replace(/\s+/g, " ").trim();
}

function erAfkortetDefinition(definition) {
  return /(?:…|\.\.\.)\s*$/u.test(definition);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const source = path.resolve(args.source);
  const target = path.resolve(args.target);

  const [wordRows, senseRows, synsetRows, exampleRows] = await Promise.all([
    readCsv(path.join(source, "words.csv")),
    readCsv(path.join(source, "senses.csv")),
    readCsv(path.join(source, "synsets.csv")),
    readCsv(path.join(source, "examples.csv")),
  ]);

  const words = new Map(
    wordRows
      .map(([wordId, form, pos]) => [
        wordId,
        {
          form: (form ?? "").trim(),
          pos,
        },
      ])
      .filter(([, word]) => word.form.length > 0),
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

    cards.push({
      id: senseId,
      opslagsord: word.form,
      ordklasse: normaliserOrdklasse(word.pos),
      definition,
      eksempler: (examples.get(senseId) ?? []).slice(0, 2),
      kilde: "DanNet",
      senseId,
      synsetId,
      afkortet: erAfkortetDefinition(definition),
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

  const manifest = {
    version: "v1",
    generatedAt: new Date().toISOString(),
    source: "DanNet CSV",
    totalCards: limitedCards.length,
    truncatedCards,
    shards,
    attribution: {
      title: "DanNet",
      license: "CC BY-SA 4.0",
      url: "https://wordnet.dk/dannet/data",
    },
  };

  await fs.writeFile(path.join(target, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`Skrev ${limitedCards.length} kort til ${target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
