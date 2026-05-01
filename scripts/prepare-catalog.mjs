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

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function download(url, target) {
  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(`Kunne ikke hente DanNet: ${response.status} ${response.statusText}`);
  }

  await fs.mkdir(path.dirname(target), { recursive: true });
  await pipeline(response.body, createWriteStream(target));
}

function runImport(source, target) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["scripts/import-dannet.mjs", "--source", source, "--target", target],
      {
        cwd: process.cwd(),
        stdio: "inherit",
      },
    );

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
    await download(url, zipPath);
    await fs.mkdir(source, { recursive: true });
    new AdmZip(zipPath).extractAllTo(source, true);
  }

  await runImport(source, target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
