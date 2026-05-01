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
  statistik: StudieStatistik;
};

export type StatistikOversigt = {
  statistik: StudieStatistik;
  dage: DagligStatistik[];
};

export type ReviewRating = "wrong" | "correct";
