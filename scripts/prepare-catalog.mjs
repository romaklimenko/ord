import AdmZip from "adm-zip";
import { createWriteStream } from "node:fs";
import { promises as fs } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

const DEFAULT_URL = "https://wordnet.dk/export/csv/dn";
const DEFAULT_SOURCE = path.join(process.cwd(), ".ord-dev", "dannet-csv");
const DEFAULT_TARGET = path.join(process.cwd(), "public", "katalog", "v1");
const DEFAULT_FREKVENS_URL = "https://korpus.dsl.dk/download/lemma-10k.zip";
const DEFAULT_FREKVENS_DIR = path.join(process.cwd(), ".ord-dev", "freq");

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function download(url, target, label) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(
      `Kunne ikke hente ${label}: ${response.status} ${response.statusText}`,
    );
  }

  await fs.mkdir(path.dirname(target), { recursive: true });
  await pipeline(response.body, createWriteStream(target));
}

async function findFørsteFil(dir, suffix) {
  const filer = await fs.readdir(dir);
  return filer.find((navn) => navn.toLowerCase().endsWith(suffix.toLowerCase())) ?? null;
}

async function klargørFrekvensfil() {
  const dir = path.resolve(process.env.ORD_FREKVENS_DIR ?? DEFAULT_FREKVENS_DIR);
  await fs.mkdir(dir, { recursive: true });

  const eksisterende = await findFørsteFil(dir, ".txt");
  if (eksisterende) {
    return path.join(dir, eksisterende);
  }

  const url = process.env.ORD_FREKVENS_URL ?? DEFAULT_FREKVENS_URL;
  const zipPath = path.join(dir, "lemmas.zip");
  console.log(`Henter frekvensliste fra ${url}`);
  await download(url, zipPath, "frekvensliste");
  new AdmZip(zipPath).extractAllTo(dir, true);

  const udpakket = await findFørsteFil(dir, ".txt");
  if (!udpakket) {
    throw new Error(`Frekvenslisten mangler .txt-fil i ${dir}`);
  }
  return path.join(dir, udpakket);
}

function runImport(source, target, frekvensFil) {
  return new Promise((resolve, reject) => {
    const args = ["scripts/import-dannet.mjs", "--source", source, "--target", target];
    if (frekvensFil) {
      args.push("--frekvens", frekvensFil);
    }
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`DanNet-import sluttede med exitkode ${code}`));
      }
    });
  });
}

async function main() {
  const target = path.resolve(process.env.ORD_CATALOG_TARGET ?? DEFAULT_TARGET);
  const manifest = path.join(target, "manifest.json");

  if (await exists(manifest)) {
    console.log("DanNet-katalog findes allerede.");
    return;
  }

  if (process.env.ORD_IMPORT_DANNET !== "true") {
    console.log("Springer DanNet-import over. Sæt ORD_IMPORT_DANNET=true for build-time import.");
    return;
  }

  const source = path.resolve(process.env.ORD_DANNET_SOURCE ?? DEFAULT_SOURCE);
  const wordsCsv = path.join(source, "words.csv");

  if (!(await exists(wordsCsv))) {
    const zipPath = path.join(process.cwd(), ".ord-dev", "dannet.zip");
    const url = process.env.ORD_DANNET_URL ?? DEFAULT_URL;
    console.log(`Henter DanNet fra ${url}`);
    await download(url, zipPath, "DanNet");
    await fs.mkdir(source, { recursive: true });
    new AdmZip(zipPath).extractAllTo(source, true);
  }

  let frekvensFil = null;
  try {
    frekvensFil = await klargørFrekvensfil();
  } catch (error) {
    console.warn(`Kunne ikke klargøre frekvensliste: ${error.message}. Kataloget bygges uden frekvens.`);
  }

  await runImport(source, target, frekvensFil);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
