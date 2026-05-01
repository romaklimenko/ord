# Plan

## Status

- [x] Flyt første sæt ideer fra `DRAFT.md` til projektets dokumentation.
- [x] Inspicer COR.SEM og COR.SEM.EXT som mulig definitionskilde.
- [x] Inspicer DanNet som bredere åben definitionskilde.
- [x] Beslut lovlig kilde til betydninger i MVP.
- [x] Beslut endelig teknisk stack.
- [x] Scaffold webappen.
- [x] Implementer login og brugerprofiler.
- [x] Implementer ordvisning med afsløring via `Enter`.
- [x] Implementer feedbackknapper og genvejstaster.
- [x] Implementer SM-2-baseret repetitionsplan.
- [x] Importer første lovlige ordliste.
- [x] Implementer basisstatistik.
- [ ] Implementer Anki-lignende diagrammer.
- [ ] Klargør hosting på `ord.klimenko.dk`.

## Næste anbefalede opgave

Udbyg statistikvisningen med Anki-lignende diagrammer og tilføj browser-/komponenttests for hotkeys og feedbackflow.

## Beslutninger

- UI, Markdown og kodekommentarer skrives på dansk.
- Chat med projektejeren kan foregå på engelsk.
- Projektet må ikke bruge DDO-scraping uden klar licensafklaring.
- Foreløbigt flashcard-format er dansk opslagsord på forsiden og dansk definition på bagsiden.
- MVP'en bruger DanNet som primær definitionskilde.
- Fuld DDO-dækning kræver sandsynligvis særskilt aftale med DSL og er ikke en MVP-blokering.
- MVP'en bygges med Next.js på Vercel.
- Auth0 bruges til login.
- Orddata lagres som genererede statiske JSON-shards, ikke i database eller blob storage.
- Brugerprogression lagres i Azure Table Storage.
- Lokal udvikling bruger først en rigtig Azure Storage-konto med separat dev-konfiguration; Azurite er kun en mulig senere testhjælper.
- Hvis Azure-credentials mangler lokalt, bruger appen en ignoreret filbaseret fallback i `.ord-dev/progress.json`.
- DanNet-eksempler importeres og vises som sekundær detalje, når de findes.
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

- [x] Vælg MVP-format for betydninger.
- [x] Vurder om betydninger skal være dansk-dansk, dansk-engelsk eller begge.
- [x] Inspicer COR.SEM og COR.SEM.EXT lokalt.
- [x] Inspicer DanNet lokalt.
- [x] Beslut at MVP bruger DanNet som primær definitionskilde.
- [x] Beslut om MVP bruger DanNet-eksempler i første UI.
- [ ] Byg import for DSL's frekvensliste.
- [ ] Byg import for DDO-lemmaliste, hvis DDO-ID'er er nyttige.
- [ ] Byg import for DDO-fuldformsliste, hvis bøjede former skal understøttes.
- [x] Byg import for DanNet-definitioner.
- [x] Tilføj kreditering af DanNet, CST/KU og DSL i produktet.
- [ ] Kontakt DSL senere, hvis fuld DDO-dækning bliver vigtig.

## Tekniske opgaver

- [x] Opret Next.js-applikationsstruktur.
- [x] Opret Auth0-konfiguration og loginflow.
- [x] Opret Azure Table Storage-klient til serverkode.
- [x] Opret datamodel for brugerprofil, korttilstand, repetitionskø, svarhistorik og daglige statistikaggregater.
- [x] Opret seed- eller importkommando til lovlige orddata.
- [x] Generer versionerede statiske DanNet JSON-shards.
- [x] Opret træningsside med tastaturstyring.
- [x] Opret statistikside.
- [x] Tilføj tests for SM-2-planlægning.
- [ ] Tilføj tests for hotkeys og feedbackflow.
- [ ] Tilføj deployment-dokumentation.
