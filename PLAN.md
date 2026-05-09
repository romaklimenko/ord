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
- [x] Implementer Anki-lignende diagrammer.
- [x] Optimer submit-svar-flowet.
- [x] Ret optimistisk kortskift, så serverresponsen ikke erstatter det viste næste ord.
- [x] Ret Fortryd-flowet, så det undone kort altid vises igen, optimistisk fejlrul tilbageføres, og keydown ikke kan dobbeltaffyre i samme JS-task.
- [x] Klargør hosting på `ord.klimenko.dk`.
- [x] QA-runde: stabiliser opslagsordets position, så det ikke hopper når kortet åbnes (ankret til toppen i stedet for vertikalt centreret).
- [x] QA-runde: byt knap-rækkefølgen på mobil, så grøn (Rigtigt) ligger over rød (Forkert), mens desktop fortsat viser grøn til højre.
- [x] QA-runde: tilføj `1` som genvej for forkert og `2` som genvej for rigtigt (oveni de eksisterende pile- og Enter-genveje).
- [x] QA-runde: ret CSS-selektoren i statistikken, så `display: none` på mobil kun rammer datolabelen og ikke selve søjlesegmenterne (rigtige/forkerte spans). Tidligere skjulte den hele diagrammet på mobil.
- [x] QA-runde: spring storage-kaldet over for gæster i `hentStudieSnapshot`, og fjern den ubrugte `Auth0Provider`-klientwrapper fra rod-layout for at gøre first-paint hurtigere på Vercel cold start.
- [x] Tilføj korpus-snapshot pr. dag (kortIAlt, setCards, modneCards, tilRepetition) på `day:`-rækken og vis et stablet søjlediagram med modne (grøn), set (gul), til repetition (orange) og ikke-set (Dannebrog-rød) i statistikken.
- [x] Lås træner-layoutet: konvertér `.træner` til grid (fortryd · ord · definition · knapper · fejl), lås `.side` til `100dvh` og lad kun `.definition` scrolle. Ord, knapper og footer holder samme pixel-position uanset om kortet er åbnet, og lange definitioner scroller mellem dem i stedet for at skubbe layoutet.
- [x] Opdater app-ikonet til Dannebrog-rød og hvid med et tydeligere `O`-motiv.

## Næste anbefalede opgave

Ingen blokerende opgave. Tag fat i en af de åbne ideer i `DRAFT.md` eller en af de resterende dataopgaver (fx kontakt DSL om DDO-dækning).

## Beslutninger

- UI, Markdown og kodekommentarer skrives på dansk.
- Chat med projektejeren kan foregå på engelsk.
- Projektet må ikke bruge DDO-scraping uden klar licensafklaring.
- Foreløbigt flashcard-format er dansk opslagsord på forsiden og dansk definition på bagsiden.
- MVP'en bruger DanNet som eneste definitionskilde for at holde import, licens og kreditering enkel.
- Afkortede DanNet-definitioner beholdes som flashcards og markeres med `afkortet`. UI'en gør slut-`…` til et link til DanNet-synsettet, så brugeren altid kan klikke sig videre til den fulde forklaring.
- Nye kort vælges med en frekvensvægtet sampling, der favoriserer almindelige ord, men stadig blander sjældne ord ind via et lille fælles gulv.
- Fuld DDO-dækning kræver sandsynligvis særskilt aftale med DSL og er ikke en MVP-blokering.
- MVP'en bygges med Next.js på Vercel.
- Auth0 bruges til login.
- Orddata lagres som genererede statiske JSON-shards, ikke i database eller blob storage.
- Brugerprogression lagres i Azure Table Storage.
- Lokal udvikling bruger først en rigtig Azure Storage-konto med separat dev-konfiguration; Azurite er kun en mulig senere testhjælper.
- Hvis Azure-credentials mangler lokalt, bruger appen en ignoreret filbaseret fallback i `.ord-dev/progress.json`.
- DanNet-eksempler importeres og vises som sekundær detalje, når de findes.
- Production genererer DanNet-kataloget i Vercel build med `ORD_IMPORT_DANNET=true`.
- `PLAN.md` holdes opdateret, og færdige implementeringsopgaver markeres lukket.

## Produktkrav

- Brugeren kan logge ind.
- Brugeren får vist et dansk ord.
- Brugeren kan afsløre betydningen med `Enter`.
- Brugeren kan markere svaret forkert med rød knap, `ArrowLeft` eller `ArrowDown`.
- Brugeren kan markere svaret korrekt med grøn knap, `ArrowRight`, `ArrowUp` eller `Enter` (når kortet er afsløret).
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
- [x] Byg import for DSL's frekvensliste og bland frekvensvægtning ind i kortvalget.
- [x] Byg import for DDO-lemmaliste (matcher kort med DDO-id når filen leveres via `--ddo-lemmaer`).
- [x] Byg import for DDO-fuldformsliste (skriver `fuldformer.json` til kataloget når filen leveres via `--ddo-fuldformer`).
- [x] Byg import for DanNet-definitioner.
- [x] Tilføj kreditering af DanNet, CST/KU og DSL i produktet.
- [x] Behold afkortede DanNet-definitioner i kataloget og link slut-`…` til DanNet-synsettet.
- [ ] Kontakt DSL senere, hvis fuld DDO-dækning bliver vigtig.

## UI-opgaver

- [x] Vis svar-knap så mobile brugere uden tastatur kan afsløre kortet.
- [x] Konsistent placering af opslagsordet, så det ikke hopper når kortet åbnes.
- [x] Lad `Enter` fungere som "rigtigt" når kortet er afsløret, så streaks kan tastes som Enter-Enter-Enter.
- [x] Behold det optimistisk viste næste kort, når review-kaldet svarer med et andet kort.
- [x] Skel tydeligt mellem definition og eksempler.
- [x] Vis altid et link til kilden, ikke kun ved afkortede definitioner.

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
- [x] Tilføj tests for hotkeys og feedbackflow.
- [x] Tilføj deployment-dokumentation.
- [x] Optimer submit-flowet med ét korts lookahead, øjeblikkelig UI-navigation og batch af Azure-skrivninger, mens review-kaldet gemmer i baggrunden.
