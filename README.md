# Ord

`Ord` er en webapp til at træne dansk ordforråd. Brugeren logger ind, får vist et tilfældigt dansk ord, tænker over betydningen og trykker `Enter` for at afsløre forklaringen. Derefter markerer brugeren svaret som forkert eller korrekt.

## Kerneflow

1. Brugeren logger ind, så progression kan gemmes.
2. Appen viser et dansk ord.
3. Brugeren trykker `Enter` for at vise betydningen.
4. Brugeren giver feedback:
   - Forkert: rød knap til venstre, `ArrowLeft` eller `ArrowDown`.
   - Korrekt: grøn knap til højre, `ArrowRight` eller `ArrowUp`.
5. Appen vælger næste ord ud fra brugerens historik og gentagelsesplan.

## Læringsmodel

Planlægningen skal tage udgangspunkt i Anki-lignende spaced repetition. Første version bør implementere en enkel SM-2-variant med:

- interval pr. bruger og ord
- gentagelsesantal
- ease-faktor
- næste repetitionsdato
- historik over svar

Statistikken bør på sigt ligne de vigtigste Anki-overblik: daglige svar, korrekte og forkerte svar, modne og nye kort samt kommende gentagelser.

## Data

MVP'en bruger DanNet som primær kilde til danske definitioner. Projektet må ikke baseres på uafklaret scraping af Den Danske Ordbog.

Den første datamodel bør skelne mellem:

- ordlister og frekvensdata
- bøjninger og opslag
- betydninger, oversættelser og eksempler
- projektets egne kuraterede eller brugerskabte noter

Se `DATA.md` for den aktuelle vurdering af DSL-kilder og licenser.

## Teknisk retning

MVP'en bygges som en managed webapp med:

- Next.js på Vercel
- Auth0 til login
- DanNet-katalog som genererede statiske JSON-shards
- Azure Table Storage til brugerprogression, repetitionskø, svarhistorik og statistikaggregater

Orddata er næsten statiske og skal derfor ikke ligge i en database i første version. Importen skal generere et versioneret katalog, som Vercel kan servere som statiske filer. Brugerdata er små, nøglebaserede og kan gemmes i Azure Table Storage med én partition pr. bruger.

Serverkald til Azure Storage skal gå gennem Next.js' Node.js-runtime. Browseren må ikke have direkte adgang til storage keys eller skrive-SAS'er. Edge-runtime er ikke et krav for MVP'en.

Lokal udvikling bruger som udgangspunkt en rigtig Azure Storage-konto med et separat dev-miljø. Azurite kan tilføjes senere til automatiserede integrationstests, men er ikke en del af standardopsætningen.

Hvis appen senere får behov for tunge adminforespørgsler, globale søgninger i brugerdata eller mere avanceret analyse, kan Azure Table Storage udskiftes med Postgres uden at ændre ordkatalogets statiske model.

## Hosting

Den offentlige instans forventes at ligge på:

`https://ord.klimenko.dk`

Hostingmodellen er Vercel med `ord.klimenko.dk` som custom domain.
