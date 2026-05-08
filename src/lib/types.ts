export type Kort = {
  id: string;
  opslagsord: string;
  ordklasse: string;
  definition: string;
  eksempler: string[];
  kilde: "DanNet";
  senseId?: string;
  synsetId?: string;
  afkortet?: boolean;
  frekvens?: number;
  ddoId?: string;
};

export type Korttilstand = {
  cardId: string;
  repetitions: number;
  easeFactor: number;
  intervalDays: number;
  dueAt: string;
  lastReviewedAt?: string;
  seen: number;
  correct: number;
  wrong: number;
};

export type DagligStatistik = {
  dato: string;
  svar: number;
  rigtige: number;
  forkerte: number;
  // Snapshot af korpus-tilstanden ved sidste review den dag. Felterne er
  // valgfri, fordi gamle dag-rækker fra før funktionen ikke har dem — de
  // vises som en tom kolonne i det stablede diagram.
  kortIAlt?: number;
  setCards?: number;
  modneCards?: number;
  // Antal kort, der er due AND NOT modne. Defineret som disjoint fra
  // modneCards, så de fire diagramsegmenter (modne, set−modne−tilRep,
  // tilRepetition, unseen) summer til kortIAlt uden overlap.
  tilRepetition?: number;
};

export type StudieStatistik = {
  totalCards: number;
  setCards: number;
  modneCards: number;
  dueToday: number;
  svarIDag: number;
  rigtigeIDag: number;
  forkerteIDag: number;
};

export type StudieSnapshot = {
  kort: Kort;
  næsteKort?: Kort;
  statistik: StudieStatistik;
};

export type StatistikOversigt = {
  statistik: StudieStatistik;
  dage: DagligStatistik[];
};

export type ReviewRating = "wrong" | "correct";
