# Data og licenser

Senest kontrolleret: 2026-05-01.

## Konklusion for første version

MVP'en bruger DanNet som primær kilde til danske definitioner. DanNet har en klar CC BY-SA 4.0-licens, kan downloades direkte og har nok dækning til at bygge den første version uden at kontakte DSL først.

Projektet må stadig ikke importere eller scrape fulde DDO-definitioner fra ordnet.dk uden særskilt skriftlig tilladelse. Hvis målet senere bliver fuld DDO-lignende dækning, inklusive sjældnere og nyere opslagsord som `bundesligahår`, skal DSL kontaktes om en aftale eller egnet dataadgang.

## Relevante DSL-ressourcer

DSL's oversigt over sprogteknologiske ressourcer:

https://korpus.dsl.dk/resources/index.html

Siden samler korpusmateriale, ordlister, semantiske ressourcer og leksikalske data. Hver ressource har egne brugsbetingelser, som skal accepteres ved download.

## Ressourcer der virker relevante

### Den Danske Ordbog på ordnet.dk

Kilder:

https://ordnet.dk/ddo/fakta-om-ddo/fakta-om-ddo

https://ordnet.dk/copyright

Indhold:

- DDO oplyser i februar 2026, at ordbogen har 106.350 opslagsord/søgestrenge, 98.988 primære opslagsord og 145.202 betydningsangivelser.
- DDO har de ønskede mere farverige opslagsord som `asfaltboble` og `bundesligahår`.

Anvendelse:

- Indholdsmæssigt er dette den bedste kilde til appens ønskede flashcards.
- Juridisk kan ordnet.dk ikke bruges som scraping-kilde. Copyrightsiden siger, at materiale fra hjemmesiden ikke må ændres, skjules, fjernes eller distribueres, og at anden kopiering end enkeltstående privat brug kræver forudgående skriftlig aftale med DSL.
- Hvis vi vil bruge fulde DDO-definitioner i appen, skal vi spørge DSL direkte om en tilladelse eller en egnet dataadgang.

### DanNet

Kilde:

https://wordnet.dk/dannet/data

Udviklerintro:

https://wordnet.dk/dannet/page/intro-developer

Indhold:

- Dansk WordNet med strukturerede synsets, ord, sanser, relationer, definitioner og eksempler.
- Licens: CC BY-SA 4.0.
- Projektet er lavet af Center for Sprogteknologi og DSL.

Lokal inspektion 2026-05-01:

- Downloadede CSV-eksporten fra `https://wordnet.dk/export/csv/dn` til `C:\tmp\ord-dsl`.
- 62.028 ordrækker.
- 59.769 unikke ordformer efter små bogstaver.
- 77.219 sanser.
- 60.578 synsets, alle med definition.
- 44.215 eksempelrækker.
- 37.297 definitioner er afkortet med ellipsetegn.
- Sammenlignet med COR.SEM dækker DanNet 27.641 ordformer, som COR.SEM ikke dækker.
- `asfaltboble`, `bundforkælet` og `ophavsretslov` findes i DanNet.
- `bundesligahår` og `bundesligagarn` findes ikke i DanNet, selv om de findes i DDO.

Anvendelse:

- Bedste åbne kandidat til MVP med DDO-lignende danske definitioner.
- Mere fleksibel end COR.SEM.EXT, fordi CC BY-SA tillader bearbejdning og viderebrug med korrekt licenshåndtering.
- Mindre komplet end fuld DDO, især for nyere, slangprægede eller mere farverige opslagsord.
- Appen skal vise klar kreditering og håndtere CC BY-SA-forpligtelser, hvis DanNet-data distribueres eller bearbejdes.
- DanNet er nok til at fortsætte med arkitektur og implementering.
- Importen skal i første version generere statiske, versionerede JSON-shards til webappen i stedet for at lægge ordkataloget i Azure Table Storage.
- Importscriptet filtrerer som standard afkortede definitioner væk, så flashcards ikke ender med en forklaring, der stopper ved `…`.
- Efter filtrering af afkortede definitioner genererer den lokale import 25.320 flashcard-kandidater og springer 41.804 DanNet-sansrækker over.

### Afkortede DanNet-definitioner og suppleringskilder

Lokal inspektion 2026-05-01:

- DanNet-importen har 67.124 mulige sansrækker efter kobling mellem ord, sanser og synsets.
- 25.320 sansrækker har komplette definitioner.
- 41.804 sansrækker har en definition, der slutter med ellipsetegn (~50 tegn før `…`).
- De afkortede rækker berører 33.590 unikke ordformer.
- 28.774 ordformer findes kun i DanNet med afkortet definition.

Rodårsag for afkortningen:

- Afkortningen er ikke et eksportfænomen. CSV, RDF/Turtle og WN-LMF XML har præcis samme afkortning ved ~50 tegn.
- DanNet-vedligeholderen bekræfter i [issue #137](https://github.com/kuhumcst/DanNet/issues/137), at afkortningen er en licensbetingelse fra DSL: DanNet må ikke offentliggøre fulde DDO-definitioner. Den fulde tekst findes kun bag ordnet.dk, som vi ikke må scrape.
- Ingen eksportformat eller alternativ kanal omgår begrænsningen uden særskilt aftale med DSL.

Vurderede suppleringskilder:

- COR.SEM.EXT bygger på samme DDO-kilde og har samme afkortning. Filtreres alle ellipsetegn fra, kan kilden kun supplere 3.292 af de 28.774 helt manglende ordformer. Licensen CC BY-NC-ND gør den også juridisk strammere end DanNet.
- Kaikki/Wiktextract for dansk dækker 7.214 helt manglende ordformer, men glosser er engelske og passer ikke til dansk-dansk MVP.
- Dansk Wiktionary-dumpet har danske forklaringer for 3.907 helt manglende ordformer, men parsing er ujævn, og mange opslag er meget korte.
- Wikidata danske leksemer (CC0) overlapper i høj grad med DanNet og giver ikke nogen reel netto-gevinst.
- Ordbog over det danske Sprog (ODS, 1918-1956) er offentlig på ordnet.dk, men distribueres ikke som datasæt og må ikke scrapes.

Konklusion 2026-05-01:

- Der findes ingen åben dansk-dansk ordbog med bedre dækning og fri tekst end DanNet under en brugbar licens.
- Vi blander ikke andre kilder ind i MVP'en. Det holder import, kreditering og licenshåndtering enkelt.
- Den tidligere strategi (smid alle afkortede definitioner væk) fjernede 62 % af DanNet's sansrækker og hele 28.774 ordformer fra appen.
- Ny strategi for MVP: behold alle DanNet-sansrækker i kataloget. Hvert kort får et `afkortet`-flag, og UI'en gør slut-`…` til et link til DanNet-synsettet. Synsettet linker selv videre til den fulde DDO-forklaring, så brugeren altid kan klikke sig frem til kilden.
- DanNet leverer 44.215 eksempelrækker uden samme afkortning. De vises som sekundær detalje og giver ekstra kontekst, særligt når definitionen er forkortet.
- Hvis fuld DDO-dækning bliver et produktkrav, er DSL-aftale stadig den eneste lovlige vej.

### Frekvensliste

Kilder:

- https://korpus.dsl.dk/resources/details/freq-lemmas.html (2024-version, gated)
- https://sprogteknologi.dk/dataset/10-000-mest-frekvente-lemmaer (2017-version, åben)

Indhold:

- DSL's frekvensliste bygger på BAKSPEJLET-korpusset.
- Den åbne 2017-version pakkes som `lemma-10k.zip`, men indeholder reelt `lemma-30k-2017.txt` med 299.999 rækker (POS, lemma, relativ frekvens, tabsepareret).
- 2024-versionen findes på korpus.dsl.dk, men kræver manuel accept af brugsbetingelser før download. Vi bruger den åbne 2017-version i MVP.
- Licens: DSL Åben Licens.

Lokal inspektion 2026-05-01:

- Hentede `lemma-10k.zip` fra `https://korpus.dsl.dk/download/lemma-10k.zip` til `C:\tmp\ord-dsl\freq`.
- 60.172 af 67.124 DanNet-kort matcher en lemma i listen (ca. 90 %).
- De resterende 6.952 kort er typisk sammensætninger eller bundne morfemer som `-agtig` og bliver behandlet som lavfrekvente.

Anvendelse:

- Importen joinrer DanNet-kort med frekvenslisten via lemma (lowercase). Hvis et lemma har flere POS-rækker, vælges den højeste frekvens.
- Hvert kort får et `frekvens`-felt med den relative korpusfrekvens (eller udelades, hvis lemma ikke findes i listen).
- Kortvalget i træneren bruger en frekvensvægtet sampling med et lille fælles gulv, så almindelige ord dominerer, men sjældne ord stadig blandes ind. Gulvet er valgt så ord uden korpusrang tilsammen får ca. 25 % af sandsynlighedsmassen.

### DDO-lemmaliste

Kilde:

https://korpus.dsl.dk/resources/details/ddo-lemmas.html

Indhold:

- Opslagsord fra Den Danske Ordbog.
- Tabseparerede felter: opslagsord, homografnummer, ordklasse og DDO-ID.
- Senest opdateret november 2025.

Anvendelse:

- Kataloget kan udvides med DDO-id pr. kort via `--ddo-lemmaer <fil>` på `import:dannet`. Opslag matches på (lemma, ordklasse) efter normalisering.
- Når et kort har `ddoId`, kan UI'en senere linke direkte til den specifikke artikel på ordnet.dk.
- Filen er bag DSL's accept-formular. Læg den decompresede TSV i fx `C:\tmp\ord-dsl\ddo\ddo-lemmaer.tsv` og pas på ikke at committe den.

### DDO-fuldformsliste

Kilde:

https://korpus.dsl.dk/resources/details/ddo-fullforms.html

Indhold:

- Bøjningsformer for DDO-opslagsord.
- Tabseparerede felter: bøjningsform, opslagsform, homografnummer, ordklasse og DDO-ID.
- Senest opdateret november 2025.

Anvendelse:

- Importen kan tage filen via `--ddo-fuldformer <fil>` og skrive den til `public/katalog/v1/fuldformer.json` som en sidefil. Den bruges ikke i UI'en endnu, men gør det muligt senere at understøtte søgning på bøjede former.
- Filen er bag DSL's accept-formular og placeres uden for repoet.

### COR.SEM

Kilde:

https://korpus.dsl.dk/resources/details/cor-sem.html

Indhold:

- Leksikalsk semantisk ressource for ca. 34.000 danske lemmaer.
- Licens: CC0.

Anvendelse:

- Mulig kandidat til semantisk gruppering eller metadata.
- Ikke nok alene som brugerrettet betydningsforklaring.

### COR.SEM.EXT

Kilde:

https://korpus.dsl.dk/resources/details/cor-sem-ext.html

Indhold:

- Betydningsforklaringer for COR.SEM-betydninger.
- For de fleste betydninger findes også DDO-eksempler.
- Licens: CC BY-NC-ND.

Anvendelse:

- Juridisk mere følsom kandidat til forklaringer.
- Licensen er ikke-kommerciel og tillader ikke bearbejdede afledninger ved distribution.
- Ikke valgt til MVP, fordi DanNet har bredere dækning og en mere fleksibel licens.

Lokal inspektion 2026-05-01:

- Downloadede `cor.sem.1.0.zip` og `cor.sem.ext.1.0.zip` til `C:\tmp\ord-dsl` uden for repoet.
- `cor.sem.1.0.tsv` har 41.993 betydningsrækker.
- `cor.sem.ext.1.0.tsv` har 41.993 betydningsrækker med samme `COR.SEM-id`-mængde.
- Data dækker 33.484 unikke DDO-opslagsord og 34.020 unikke DDO-artikel-ID'er.
- Alle 41.993 rækker har en definition.
- 33.061 rækker har mindst ét brugseksempel.
- 26.678 definitioner er afkortet med ellipsetegn.
- Rå TSV-størrelse er ca. 7,6 MB pr. fil, så lagring er ikke et teknisk problem for MVP.

Foreløbig produktvurdering:

- COR.SEM.EXT er indholdsmæssigt velegnet til en lille første version med dansk-danske flashcards.
- Dækningen er god for almindeligt ordforråd, men den er ikke hele DDO's ca. 100.000 opslagsord.
- Definitionerne er korte og flashcard-egnede, men mange er bevidst afkortede.
- COR.SEM samler nogle nært beslægtede DDO-betydninger og udelader sjældne, historiske, faglige og faste udtryk, så appen bør ikke præsentere sig som en fuld DDO-erstatning.
- Efter DanNet-inspektionen er COR.SEM.EXT ikke længere den stærkeste åbne kandidat, fordi DanNet har bredere dækning og en mere anvendelig licens.
- COR.SEM.EXT kan stadig være relevant, hvis DSL anbefaler den direkte.

Licenspolitik for MVP:

- DanNet-data bruges under CC BY-SA 4.0.
- Appen viser tydelig kreditering af DanNet, Center for Sprogteknologi, KU og DSL.
- Appen linker til DanNet og CC BY-SA 4.0.
- Appen præsenterer sig ikke som en fuld DDO-erstatning.
- Appen scraper ikke ordnet.dk.
- DDO-links fra DanNet kan vises som kilde- eller læs mere-links.
- Importeret DanNet-data bør i første omgang hentes via importkommando i stedet for at blive committet som stor datafil.

## DSL's åbne brugsbetingelser

Kilde:

https://korpus.dsl.dk/resources/licences/dsl-open.html

DSL's åbne ressourcer må bruges til de fleste formål, også kommercielt, og de må redigeres og videredistribueres. Der er dog et væsentligt forbehold: de må ikke bruges til at udgive en ordbog eller et produkt, der konkurrerer med DSL's egne produkter. DSL beder også om passende kreditering og link til `dsl.dk`.

Praktisk konsekvens:

- En træningsapp kan sandsynligvis bruge åbne ordlister og frekvensdata, hvis appen ikke bliver en konkurrerende ordbog.
- Produktet skal kreditere DSL, når DSL-data bruges.
- Ved tvivl skal projektet kontakte `korpus@dsl.dk`.

## Åbne spørgsmål

- Skal første UI vise DanNet-eksempler altid eller kun som sekundær detalje?
- Skal repoet indeholde en lille DanNet-baseret testfixture, og hvordan skal den krediteres?
- Skal repoet indeholde genererede katalog-shards, eller skal de bygges fra downloadede DanNet-filer i et separat importtrin?
- Skal appen vise link til DDO for hvert ord i stedet for at kopiere forklaringer?
- Skal DSL kontaktes senere for at undersøge fuld DDO-dækning?
