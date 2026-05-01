# Data og licenser

Senest kontrolleret: 2026-05-01.

## Konklusion for første version

Brug DSL's åbne ressourcer som grundlag for ordlister, frekvenser og bøjninger, men undgå at importere ordbogsartikler, fulde DDO-definitioner eller eksempler uden særskilt licensafklaring.

Til MVP bør appen have en separat, projektstyret kilde til betydninger, fx en lille manuelt kurateret liste med tydelig licens. Derefter kan vi undersøge, om COR.SEM.EXT eller en direkte aftale med DSL kan bruges til forklaringer.

## Relevante DSL-ressourcer

DSL's oversigt over sprogteknologiske ressourcer:

https://korpus.dsl.dk/resources/index.html

Siden samler korpusmateriale, ordlister, semantiske ressourcer og leksikalske data. Hver ressource har egne brugsbetingelser, som skal accepteres ved download.

## Ressourcer der virker relevante

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
- Må ikke bruges i appen, før vi har besluttet præcis distributionsform og eventuelt kontaktet DSL.

## DSL's åbne brugsbetingelser

Kilde:

https://korpus.dsl.dk/resources/licences/dsl-open.html

DSL's åbne ressourcer må bruges til de fleste formål, også kommercielt, og de må redigeres og videredistribueres. Der er dog et væsentligt forbehold: de må ikke bruges til at udgive en ordbog eller et produkt, der konkurrerer med DSL's egne produkter. DSL beder også om passende kreditering og link til `dsl.dk`.

Praktisk konsekvens:

- En træningsapp kan sandsynligvis bruge åbne ordlister og frekvensdata, hvis appen ikke bliver en konkurrerende ordbog.
- Produktet skal kreditere DSL, når DSL-data bruges.
- Ved tvivl skal projektet kontakte `korpus@dsl.dk`.

## Åbne spørgsmål

- Hvilken kilde skal bruges til korte, brugerrettede betydninger i MVP?
- Skal betydninger være på dansk, engelsk eller begge dele?
- Skal repoet indeholde datafiler, eller skal de downloades i et separat importtrin?
- Skal appen vise link til DDO for hvert ord i stedet for at kopiere forklaringer?
- Skal DSL kontaktes tidligt for at afklare, om en non-commercial træningsapp med COR.SEM.EXT er acceptabel?
