import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Træner } from "@/components/Traener";
import type { AktuelBruger } from "@/lib/session";
import type { StudieSnapshot } from "@/lib/types";

const bruger: AktuelBruger = {
  id: "dev-user",
  navn: "Lokal bruger",
  authKonfigureret: false,
  authAktiv: false,
};

const førsteSnapshot: StudieSnapshot = {
  kort: {
    id: "kort-1",
    opslagsord: "asfaltboble",
    ordklasse: "substantiv",
    definition: "boble eller bule i asfaltbelægning",
    eksempler: [],
    kilde: "DanNet",
  },
  statistik: {
    totalCards: 2,
    setCards: 0,
    modneCards: 0,
    dueToday: 0,
    svarIDag: 0,
    rigtigeIDag: 0,
    forkerteIDag: 0,
  },
};

const andetSnapshot: StudieSnapshot = {
  kort: {
    id: "kort-2",
    opslagsord: "vandtæt",
    ordklasse: "adjektiv",
    definition: "som vand ikke kan trænge igennem",
    eksempler: [],
    kilde: "DanNet",
  },
  statistik: {
    totalCards: 2,
    setCards: 1,
    modneCards: 0,
    dueToday: 0,
    svarIDag: 1,
    rigtigeIDag: 1,
    forkerteIDag: 0,
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Træner", () => {
  it("afslører definitionen med Enter", async () => {
    render(<Træner bruger={bruger} førsteSnapshot={førsteSnapshot} />);

    expect(screen.queryByText("boble eller bule i asfaltbelægning")).not.toBeInTheDocument();

    await userEvent.keyboard("{Enter}");

    expect(screen.getByText("boble eller bule i asfaltbelægning")).toBeInTheDocument();
  });

  it("afslører definitionen via Vis svar-knappen", async () => {
    render(<Træner bruger={bruger} førsteSnapshot={førsteSnapshot} />);

    await userEvent.click(screen.getByRole("button", { name: "Vis svar" }));

    expect(screen.getByText("boble eller bule i asfaltbelægning")).toBeInTheDocument();
  });

  it("viser kildelink også når definitionen er fuld", async () => {
    const fuldSnapshot: StudieSnapshot = {
      kort: {
        id: "kort-fuld",
        opslagsord: "asfaltboble",
        ordklasse: "substantiv",
        definition: "boble eller bule i asfaltbelægning",
        eksempler: [],
        kilde: "DanNet",
        synsetId: "synset-99999",
      },
      statistik: førsteSnapshot.statistik,
    };

    render(<Træner bruger={bruger} førsteSnapshot={fuldSnapshot} />);

    await userEvent.keyboard("{Enter}");

    const link = screen.getByRole("link", { name: /Se hos DanNet/ });
    expect(link).toHaveAttribute("href", "https://wordnet.dk/dannet/data/synset-99999");
  });

  it("viser afkortet definition med link til DanNet-synsettet", async () => {
    const afkortetSnapshot: StudieSnapshot = {
      kort: {
        id: "kort-afkortet",
        opslagsord: "magnet",
        ordklasse: "substantiv",
        definition: "genstand, fx et redskab el. en komponent, som fysi…",
        eksempler: [],
        kilde: "DanNet",
        synsetId: "synset-12345",
        afkortet: true,
      },
      statistik: førsteSnapshot.statistik,
    };

    render(<Træner bruger={bruger} førsteSnapshot={afkortetSnapshot} />);

    await userEvent.keyboard("{Enter}");

    const link = screen.getByRole("link", { name: "…" });
    expect(link).toHaveAttribute("href", "https://wordnet.dk/dannet/data/synset-12345");
  });

  it("sender korrekt svar med Enter når kortet er afsløret", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => andetSnapshot,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Træner bruger={bruger} førsteSnapshot={førsteSnapshot} />);

    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => expect(screen.getByText("vandtæt")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/reviews",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ cardId: "kort-1", rating: "correct" }),
      }),
    );
  });

  it("sender korrekt svar med højre pil og viser næste kort", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => andetSnapshot,
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<Træner bruger={bruger} førsteSnapshot={førsteSnapshot} />);

    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{ArrowRight}");

    await waitFor(() => expect(screen.getByText("vandtæt")).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/reviews",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ cardId: "kort-1", rating: "correct" }),
      }),
    );
  });
});
