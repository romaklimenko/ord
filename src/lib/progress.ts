import { promises as fs } from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import {
  AzureNamedKeyCredential,
  TableClient,
  TableTransaction,
  type TableEntityResult,
} from "@azure/data-tables";
import { tilDatoNøgle } from "@/lib/date";
import type { DagligStatistik, Korttilstand, ReviewRating } from "@/lib/types";

export type BrugerProgress = {
  kort: Record<string, Korttilstand>;
  dage: Record<string, DagligStatistik>;
};

type ReviewEvent = {
  cardId: string;
  rating: ReviewRating;
  reviewedAt: string;
  nextDueAt: string;
  forrigeKort: Korttilstand | null;
  forrigeDag: DagligStatistik | null;
};

export type FortrydResultat = {
  cardId: string;
};

type ProgressRepository = {
  hent(userId: string): Promise<BrugerProgress>;
  gemReview(
    userId: string,
    state: Korttilstand,
    dag: DagligStatistik,
    event: ReviewEvent,
  ): Promise<void>;
  fortrydSidsteReview(userId: string): Promise<FortrydResultat | null>;
};

type LokalDatabase = {
  users: Record<string, BrugerProgress & { events: ReviewEvent[] }>;
};

let repository: ProgressRepository | null = null;

function brugerPartition(userId: string) {
  return `u_${createHash("sha256").update(userId).digest("hex").slice(0, 32)}`;
}

function tomProgress(): BrugerProgress {
  return {
    kort: {},
    dage: {},
  };
}

function harAzureKonfiguration() {
  return Boolean(
    process.env.AZURE_STORAGE_CONNECTION_STRING ||
      (process.env.AZURE_STORAGE_ACCOUNT && process.env.AZURE_STORAGE_ACCESS_KEY),
  );
}

function storageMode() {
  const mode = process.env.ORD_STORAGE_MODE ?? "auto";
  if (mode !== "auto" && mode !== "azure" && mode !== "file") {
    throw new Error(`Ukendt ORD_STORAGE_MODE: ${mode}`);
  }
  return mode;
}

export function brugerAzureStorage() {
  const mode = storageMode();
  return mode === "azure" || (mode === "auto" && harAzureKonfiguration());
}

export function hentProgressRepository() {
  if (repository) {
    return repository;
  }

  if (brugerAzureStorage()) {
    repository = new AzureProgressRepository();
  } else {
    repository = new FilProgressRepository();
  }

  return repository;
}

class FilProgressRepository implements ProgressRepository {
  private get fil() {
    return path.join(process.cwd(), ".ord-dev", "progress.json");
  }

  async hent(userId: string) {
    const db = await this.læsDatabase();
    const key = brugerPartition(userId);
    return db.users[key] ?? tomProgress();
  }

  async gemReview(userId: string, state: Korttilstand, dag: DagligStatistik, event: ReviewEvent) {
    const db = await this.læsDatabase();
    const key = brugerPartition(userId);
    const bruger = db.users[key] ?? { ...tomProgress(), events: [] };

    bruger.kort[state.cardId] = state;
    bruger.dage[dag.dato] = dag;
    bruger.events.unshift(event);
    bruger.events = bruger.events.slice(0, 1000);
    db.users[key] = bruger;

    await fs.mkdir(path.dirname(this.fil), { recursive: true });
    await fs.writeFile(this.fil, `${JSON.stringify(db, null, 2)}\n`, "utf8");
  }

  async fortrydSidsteReview(userId: string): Promise<FortrydResultat | null> {
    const db = await this.læsDatabase();
    const key = brugerPartition(userId);
    const bruger = db.users[key];
    if (!bruger || bruger.events.length === 0) {
      return null;
    }
    const event = bruger.events[0];
    if (event.forrigeKort === undefined || event.forrigeDag === undefined) {
      return null;
    }

    if (event.forrigeKort === null) {
      delete bruger.kort[event.cardId];
    } else {
      bruger.kort[event.cardId] = event.forrigeKort;
    }

    const dato = tilDatoNøgle(new Date(event.reviewedAt));
    if (event.forrigeDag === null) {
      delete bruger.dage[dato];
    } else {
      bruger.dage[event.forrigeDag.dato] = event.forrigeDag;
    }

    bruger.events.shift();
    db.users[key] = bruger;

    await fs.mkdir(path.dirname(this.fil), { recursive: true });
    await fs.writeFile(this.fil, `${JSON.stringify(db, null, 2)}\n`, "utf8");
    return { cardId: event.cardId };
  }

  private async læsDatabase(): Promise<LokalDatabase> {
    try {
      return JSON.parse(await fs.readFile(this.fil, "utf8")) as LokalDatabase;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return { users: {} };
      }
      throw error;
    }
  }
}

type KortEntity = {
  partitionKey: string;
  rowKey: string;
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  dueAt: string;
  lastReviewedAt?: string;
  seen: number;
  correct: number;
  wrong: number;
};

type DagEntity = {
  partitionKey: string;
  rowKey: string;
  svar: number;
  rigtige: number;
  forkerte: number;
  kortIAlt?: number;
  setCards?: number;
  modneCards?: number;
  tilRepetition?: number;
};

class AzureProgressRepository implements ProgressRepository {
  private client: TableClient;
  private tableReady: Promise<void> | null = null;

  constructor() {
    const tableName = process.env.AZURE_TABLE_NAME ?? "OrdUserData";

    if (process.env.AZURE_STORAGE_CONNECTION_STRING) {
      this.client = TableClient.fromConnectionString(process.env.AZURE_STORAGE_CONNECTION_STRING, tableName);
      return;
    }

    const account = process.env.AZURE_STORAGE_ACCOUNT;
    const key = process.env.AZURE_STORAGE_ACCESS_KEY;

    if (!account || !key) {
      throw new Error("Azure Table Storage mangler credentials.");
    }

    const credential = new AzureNamedKeyCredential(account, key);
    this.client = new TableClient(`https://${account}.table.core.windows.net`, tableName, credential);
  }

  async hent(userId: string) {
    const partitionKey = brugerPartition(userId);
    try {
      return await this.hentFraTabel(partitionKey);
    } catch (error) {
      if (!this.erTabelMangler(error)) {
        throw error;
      }

      await this.sikreTabel();
      return tomProgress();
    }
  }

  private async hentFraTabel(partitionKey: string) {
    const progress = tomProgress();
    // RowKey-prefiks i stigende rækkefølge: card:, day:, evt:. Vi henter
    // card og day i ét listEntities-kald ved at filtrere alt < 'day;'.
    // Det sparer en round-trip mod Azure (~80-140ms i produktion).
    const filter = `PartitionKey eq '${partitionKey}' and RowKey ge 'card:' and RowKey lt 'day;'`;

    for await (const entity of this.client.listEntities<KortEntity | DagEntity>({
      queryOptions: { filter },
    })) {
      const rowKey = entity.rowKey ?? "";

      if (rowKey.startsWith("card:")) {
        const kort = entity as TableEntityResult<KortEntity>;
        progress.kort[rowKey.slice("card:".length)] = {
          cardId: rowKey.slice("card:".length),
          repetitions: Number(kort.repetitions ?? 0),
          easeFactor: Number(kort.easeFactor ?? 2.5),
          intervalDays: Number(kort.intervalDays ?? 0),
          dueAt: String(kort.dueAt),
          lastReviewedAt: kort.lastReviewedAt ? String(kort.lastReviewedAt) : undefined,
          seen: Number(kort.seen ?? 0),
          correct: Number(kort.correct ?? 0),
          wrong: Number(kort.wrong ?? 0),
        };
      } else if (rowKey.startsWith("day:")) {
        const dag = entity as TableEntityResult<DagEntity>;
        const dato = rowKey.slice("day:".length);
        progress.dage[dato] = {
          dato,
          svar: Number(dag.svar ?? 0),
          rigtige: Number(dag.rigtige ?? 0),
          forkerte: Number(dag.forkerte ?? 0),
          kortIAlt: dag.kortIAlt != null ? Number(dag.kortIAlt) : undefined,
          setCards: dag.setCards != null ? Number(dag.setCards) : undefined,
          modneCards: dag.modneCards != null ? Number(dag.modneCards) : undefined,
          tilRepetition: dag.tilRepetition != null ? Number(dag.tilRepetition) : undefined,
        };
      }
    }

    return progress;
  }

  async gemReview(userId: string, state: Korttilstand, dag: DagligStatistik, event: ReviewEvent) {
    const partitionKey = brugerPartition(userId);
    try {
      await this.gemReviewITabel(partitionKey, state, dag, event);
    } catch (error) {
      if (!this.erTabelMangler(error)) {
        throw error;
      }

      await this.sikreTabel();
      await this.gemReviewITabel(partitionKey, state, dag, event);
    }
  }

  private async gemReviewITabel(
    partitionKey: string,
    state: Korttilstand,
    dag: DagligStatistik,
    event: ReviewEvent,
  ) {
    const reverseTicks = String(Number.MAX_SAFE_INTEGER - Date.parse(event.reviewedAt)).padStart(16, "0");
    const eventId = randomUUID();
    const transaction = new TableTransaction();

    transaction.upsertEntity(
      {
        partitionKey,
        rowKey: `card:${state.cardId}`,
        repetitions: state.repetitions,
        easeFactor: state.easeFactor,
        intervalDays: state.intervalDays,
        dueAt: state.dueAt,
        lastReviewedAt: state.lastReviewedAt,
        seen: state.seen,
        correct: state.correct,
        wrong: state.wrong,
      },
      "Replace",
    );

    transaction.upsertEntity(
      {
        partitionKey,
        rowKey: `day:${dag.dato}`,
        svar: dag.svar,
        rigtige: dag.rigtige,
        forkerte: dag.forkerte,
        kortIAlt: dag.kortIAlt,
        setCards: dag.setCards,
        modneCards: dag.modneCards,
        tilRepetition: dag.tilRepetition,
      },
      "Replace",
    );

    transaction.upsertEntity(
      {
        partitionKey,
        rowKey: `evt:${reverseTicks}:${event.cardId}:${eventId}`,
        cardId: event.cardId,
        rating: event.rating,
        reviewedAt: event.reviewedAt,
        nextDueAt: event.nextDueAt,
        forrigeKortJson: event.forrigeKort ? JSON.stringify(event.forrigeKort) : "",
        forrigeDagJson: event.forrigeDag ? JSON.stringify(event.forrigeDag) : "",
      },
      "Replace",
    );

    await this.client.submitTransaction(transaction.actions);
  }

  async fortrydSidsteReview(userId: string): Promise<FortrydResultat | null> {
    const partitionKey = brugerPartition(userId);
    try {
      return await this.fortrydSidsteReviewITabel(partitionKey);
    } catch (error) {
      if (!this.erTabelMangler(error)) {
        throw error;
      }

      await this.sikreTabel();
      return null;
    }
  }

  private async fortrydSidsteReviewITabel(partitionKey: string): Promise<FortrydResultat | null> {
    const filter = `PartitionKey eq '${partitionKey}' and RowKey ge 'evt:' and RowKey lt 'evt;'`;

    let nyesteEvent:
      | (TableEntityResult<Record<string, unknown>> & {
          rowKey: string;
        })
      | null = null;

    for await (const entity of this.client.listEntities<Record<string, unknown>>({
      queryOptions: { filter },
    })) {
      // RowKey'en er konstrueret med reverseTicks, så listEntities returnerer
      // den nyeste først. Vi tager kun det første element.
      nyesteEvent = entity as TableEntityResult<Record<string, unknown>> & {
        rowKey: string;
      };
      break;
    }

    if (!nyesteEvent) {
      return null;
    }

    const cardId = String(nyesteEvent.cardId ?? "");
    const reviewedAt = String(nyesteEvent.reviewedAt ?? "");
    const forrigeKortJson = nyesteEvent.forrigeKortJson;
    const forrigeDagJson = nyesteEvent.forrigeDagJson;

    if (typeof forrigeKortJson !== "string" || typeof forrigeDagJson !== "string") {
      return null;
    }

    const forrigeKort = forrigeKortJson
      ? (JSON.parse(forrigeKortJson) as Korttilstand)
      : null;
    const forrigeDag = forrigeDagJson
      ? (JSON.parse(forrigeDagJson) as DagligStatistik)
      : null;

    if (forrigeKort) {
      await this.client.upsertEntity(
        {
          partitionKey,
          rowKey: `card:${cardId}`,
          repetitions: forrigeKort.repetitions,
          easeFactor: forrigeKort.easeFactor,
          intervalDays: forrigeKort.intervalDays,
          dueAt: forrigeKort.dueAt,
          lastReviewedAt: forrigeKort.lastReviewedAt,
          seen: forrigeKort.seen,
          correct: forrigeKort.correct,
          wrong: forrigeKort.wrong,
        },
        "Replace",
      );
    } else {
      await this.deleteEntityIgnoreMissing(partitionKey, `card:${cardId}`);
    }

    const dato = tilDatoNøgle(new Date(reviewedAt));
    if (forrigeDag) {
      await this.client.upsertEntity(
        {
          partitionKey,
          rowKey: `day:${forrigeDag.dato}`,
          svar: forrigeDag.svar,
          rigtige: forrigeDag.rigtige,
          forkerte: forrigeDag.forkerte,
          kortIAlt: forrigeDag.kortIAlt,
          setCards: forrigeDag.setCards,
          modneCards: forrigeDag.modneCards,
          tilRepetition: forrigeDag.tilRepetition,
        },
        "Replace",
      );
    } else {
      await this.deleteEntityIgnoreMissing(partitionKey, `day:${dato}`);
    }

    await this.deleteEntityIgnoreMissing(partitionKey, nyesteEvent.rowKey);
    return { cardId };
  }

  private async deleteEntityIgnoreMissing(partitionKey: string, rowKey: string) {
    try {
      await this.client.deleteEntity(partitionKey, rowKey);
    } catch (error) {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode !== 404) {
        throw error;
      }
    }
  }

  private sikreTabel() {
    this.tableReady ??= this.client.createTable().catch((error: unknown) => {
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode !== 409) {
        throw error;
      }
    });
    return this.tableReady;
  }

  private erTabelMangler(error: unknown) {
    return (error as { statusCode?: number }).statusCode === 404;
  }
}

export function hentDag(progress: BrugerProgress, dato = tilDatoNøgle()) {
  return progress.dage[dato] ?? {
    dato,
    svar: 0,
    rigtige: 0,
    forkerte: 0,
  };
}
