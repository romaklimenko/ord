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

Den tekniske stack er ikke besluttet. Næste beslutning skal tage højde for, at projektet helst skal kunne hostes billigt eller gratis på en managed platform som Vercel.

Foreløbige krav til stacken:

- login og flere brugere
- persistent repetitionstilstand pr. bruger og ord
- import af DanNet-data
- enkel drift på `ord.klimenko.dk`
- lav eller ingen fast hostingudgift

## Hosting

Den offentlige instans forventes at ligge på:

`https://ord.klimenko.dk`

Hostingmodellen er ikke besluttet. Vercel eller en tilsvarende managed platform er den foretrukne retning, hvis database og auth kan holdes enkle og billige.
