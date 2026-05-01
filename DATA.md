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

### Frekvensliste

Kilde:

https://korpus.dsl.dk/resources/details/freq-lemmas.html

Indhold:

- 30.000 hyppigste danske lemmaer med ordklasse og frekvens.
- Findes både med og uden proprier og numeralier.
- Frekvensen bygger på BAKSPEJLET 2024 med tekster fra 1983 til 2024.

Anvendelse:

- God kandidat til at vælge startord og prioritere ord efter frekvens.

### DDO-lemmaliste

Kilde:

https://korpus.dsl.dk/resources/details/ddo-lemmas.html

Indhold:

- Opslagsord fra Den Danske Ordbog.
- Tabseparerede felter: opslagsord, homografnummer, ordklasse og DDO-ID.
- Senest opdateret november 2025.

Anvendelse:

- God kandidat til ordidentitet og kobling til DDO-ID'er.
- Indeholder ikke betydningsforklaringer.

### DDO-fuldformsliste

Kilde:

https://korpus.dsl.dk/resources/details/ddo-fullforms.html

Indhold:

- Bøjningsformer for DDO-opslagsord.
- Tabseparerede felter: bøjningsform, opslagsform, homografnummer, ordklasse og DDO-ID.
- Senest opdateret november 2025.

Anvendelse:

- God kandidat til søgning, importnormalisering og genkendelse af bøjede former.
- Indeholder ikke bøjningsoplysninger pr. form og kan indeholde sjældne eller automatisk genererede former.

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

- Skal MVP'en importere DanNet-eksempler, eller kun definitioner?
- Skal repoet indeholde en lille DanNet-baseret testfixture, og hvordan skal den krediteres?
- Skal repoet indeholde datafiler, eller skal de downloades i et separat importtrin?
- Skal appen vise link til DDO for hvert ord i stedet for at kopiere forklaringer?
- Skal DSL kontaktes senere for at undersøge fuld DDO-dækning?
