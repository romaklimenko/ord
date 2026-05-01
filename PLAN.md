# Plan

## Status

- [x] Flyt første sæt ideer fra `DRAFT.md` til projektets dokumentation.
- [ ] Beslut endelig teknisk stack.
- [ ] Beslut lovlig kilde til betydninger i MVP.
- [ ] Scaffold webappen.
- [ ] Implementer login og brugerprofiler.
- [ ] Implementer ordvisning med afsløring via `Enter`.
- [ ] Implementer feedbackknapper og genvejstaster.
- [ ] Implementer SM-2-baseret repetitionsplan.
- [ ] Importer første lovlige ordliste.
- [ ] Implementer basisstatistik.
- [ ] Implementer Anki-lignende diagrammer.
- [ ] Klargør hosting på `ord.klimenko.dk`.

## Næste anbefalede opgave

Beslut den tekniske stack, før der skrives applikationskode. Det nuværende forslag er Django, PostgreSQL, serverrenderede sider, lidt JavaScript til tastaturinteraktion og Chart.js til statistik.

## Beslutninger

- UI, Markdown og kodekommentarer skrives på dansk.
- Chat med projektejeren kan foregå på engelsk.
- Projektet må ikke bruge DDO-scraping uden klar licensafklaring.
- `PLAN.md` holdes opdateret, og færdige implementeringsopgaver markeres lukket.

## Produktkrav

- Brugeren kan logge ind.
- Brugeren får vist et dansk ord.
- Brugeren kan afsløre betydningen med `Enter`.
- Brugeren kan markere svaret forkert med rød knap, `ArrowLeft` eller `ArrowDown`.
- Brugeren kan markere svaret korrekt med grøn knap, `ArrowRight` eller `ArrowUp`.
- Appen gemmer brugerens progression pr. ord.
- Appen vælger ord med en Anki-lignende SM-2-plan.
- Appen viser statistik og diagrammer, der minder om Anki.

## Dataopgaver

- [ ] Vælg MVP-format for betydninger.
- [ ] Vurder om betydninger skal være dansk-dansk, dansk-engelsk eller begge.
- [ ] Byg import for DSL's frekvensliste.
- [ ] Byg import for DDO-lemmaliste, hvis DDO-ID'er er nyttige.
- [ ] Byg import for DDO-fuldformsliste, hvis bøjede former skal understøttes.
- [ ] Tilføj kreditering af DSL i produktet, hvis DSL-data bruges.
- [ ] Kontakt DSL ved tvivl om brug, især hvis COR.SEM.EXT overvejes.

## Tekniske opgaver

- [ ] Opret applikationsstruktur.
- [ ] Opret datamodel for brugere, ord, kort, svarhistorik og repetitionstilstand.
- [ ] Opret seed- eller importkommando til lovlige orddata.
- [ ] Opret træningsside med tastaturstyring.
- [ ] Opret statistikside.
- [ ] Tilføj tests for SM-2-planlægning.
- [ ] Tilføj tests for hotkeys og feedbackflow.
- [ ] Tilføj deployment-dokumentation.
