import { promises as fs } from "node:fs";
import path from "node:path";
import { demoKort } from "@/data/demoCards";
import type { Kort } from "@/lib/types";

type KatalogManifest = {
  version: string;
  generatedAt: string;
  totalCards: number;
  shards: Array<{
    file: string;
    count: number;
  }>;
};

let cache: Kort[] | null = null;

async function findes(fil: string) {
  try {
    await fs.access(fil);
    return true;
  } catch {
    return false;
  }
}

export async function hentKatalog(): Promise<Kort[]> {
  if (cache) {
    return cache;
  }

  const katalogRod = path.join(process.cwd(), "public", "katalog", "v1");
  const manifestFil = path.join(katalogRod, "manifest.json");

  if (!(await findes(manifestFil))) {
    cache = demoKort;
    return cache;
  }

  const manifest = JSON.parse(await fs.readFile(manifestFil, "utf8")) as KatalogManifest;
  const shards = await Promise.all(
    manifest.shards.map(async (shard) => {
      const fil = path.join(katalogRod, shard.file);
      return JSON.parse(await fs.readFile(fil, "utf8")) as Kort[];
    }),
  );

  cache = shards.flat();
  return cache;
}
