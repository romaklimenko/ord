# Arbejdsregler for Ord

## Sprog

- Al Markdown, UI-tekst og kodekommentarer skal skrives på dansk.
- Samtaler med projektejeren kan foregå på engelsk.
- Variabelnavne, funktionsnavne og tekniske identifikatorer kan være på engelsk, medmindre et dansk navn er tydeligt bedre i domænet.

## Arbejdsgang

- Ideer i `DRAFT.md` skal behandles en ad gangen, flyttes til relevante dokumenter eller opgaver og derefter fjernes fra `DRAFT.md`.
- `PLAN.md` er den løbende arbejdsplan. Den skal opdateres, når opgaver tilføjes, ændres eller lukkes.
- Når en opgave er implementeret i kode, skal den markeres som lukket i `PLAN.md`.
- Efter en implementeret opgave skal assistenten foreslå en passende commit-besked og stoppe, så projektejeren kan gennemgå ændringen.
- Assistenten må ikke lave commits, medmindre projektejeren beder eksplicit om det.

## Produktretning

- Appen hedder foreløbigt `Ord`.
- Den offentlige instans forventes hostet på `ord.klimenko.dk`.
- Appen skal hjælpe brugere med at træne dansk ordforråd med login, gemt progression, gentagelsesplanlægning og statistik.
- Brugerfladen skal være enkel, hurtig og tastaturvenlig.

## Kvalitet

- Juridiske forhold omkring orddata skal dokumenteres, før data importeres eller publiceres.
- UI-ændringer skal kontrolleres i en browser, når der findes en kørende webapp.
- Tekniske valg skal holdes enkle og billige, fordi projektet forventes at have få brugere og være open source.
