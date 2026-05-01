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

## Lokal udvikling

Installer afhængigheder:

```powershell
npm install
```

Udfyld `.env.local` efter behov. Uden Auth0- og Azure-credentials bruger appen en lokal udviklingsbruger og gemmer progression i `.ord-dev/progress.json`. Hvis `AZURE_STORAGE_CONNECTION_STRING` eller `AZURE_STORAGE_ACCOUNT`/`AZURE_STORAGE_ACCESS_KEY` sættes, bruger appen Azure Table Storage.

Generer lokalt DanNet-katalog fra den downloadede CSV-eksport:

```powershell
npm run import:dannet -- --source C:\tmp\ord-dsl\dannet-csv --frekvens C:\tmp\ord-dsl\freq\lemma-30k-2017.txt
```

Kataloget skrives til `public/katalog/v1`, som ikke committes. Importen beholder afkortede definitioner og markerer dem med et `afkortet`-flag. Hvis kataloget mangler, bruger appen et lille indbygget udviklingskatalog.

Frekvensfilen kan hentes på forhånd fra `https://korpus.dsl.dk/download/lemma-10k.zip` (filen indeholder 30.000-listen). Hvis `--frekvens` udelades, bygges kataloget uden frekvens, og kortvalget bliver uniformt tilfældigt for nye kort.

Start appen:

```powershell
npm run dev
```

Kør kvalitetstjek:

```powershell
npm run lint
npm test
npm run build
```

## Hosting

Den offentlige instans forventes at ligge på:

`https://ord.klimenko.dk`

Hostingmodellen er Vercel med `ord.klimenko.dk` som custom domain.

Se `DEPLOYMENT.md` for miljøvariabler og udestående deploymentvalg.
