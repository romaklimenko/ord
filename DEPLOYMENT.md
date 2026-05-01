# Deployment

Ord deployes som en Next.js-app på Vercel.

## Vercel

Projektet kan oprettes som et almindeligt Vercel-projekt med standardindstillinger for Next.js:

- install command: `npm install`
- build command: `npm run build`
- output: Next.js standard
- production domain: `ord.klimenko.dk`

## Miljøvariabler

Følgende miljøvariabler skal sættes i Vercel:

```text
APP_BASE_URL=https://ord.klimenko.dk
ORD_STORAGE_MODE=azure
ORD_IMPORT_DANNET=true
AZURE_TABLE_NAME=OrdUserData
AZURE_STORAGE_CONNECTION_STRING=<storage-connection-string>
AUTH0_SECRET=<32-byte-secret>
AUTH0_DOMAIN=<tenant>.auth0.com
AUTH0_CLIENT_ID=<client-id>
AUTH0_CLIENT_SECRET=<client-secret>
```

Alternativt kan Azure sættes med konto og key:

```text
AZURE_STORAGE_ACCOUNT=<account-name>
AZURE_STORAGE_ACCESS_KEY=<account-key>
```

`ORD_STORAGE_MODE=azure` bør bruges i production, så appen fejler tydeligt hvis Azure-credentials mangler. Lokal udvikling kan bruge `ORD_STORAGE_MODE=auto`.

## Auth0

Auth0-applikationen skal have disse URL'er:

- Allowed Callback URLs: `https://ord.klimenko.dk/auth/callback`
- Allowed Logout URLs: `https://ord.klimenko.dk`
- Allowed Web Origins: `https://ord.klimenko.dk`
- Application Login URI: `https://ord.klimenko.dk/auth/login`

Lokalt kan følgende URL'er også tilføjes:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000`

## Azure Table Storage

Appen opretter tabellen automatisk, hvis den ikke findes. Den bruger én partition pr. bruger og rækker med disse prefixes:

- `card#` for repetitionsstatus pr. kort
- `day#` for daglige statistikaggregater
- `evt#` for svarhistorik

Storage keys må kun ligge i servermiljøet. Browseren må ikke få direkte skriveadgang til Azure Storage.

## DanNet-katalog

Lokalt genereres kataloget med:

```powershell
npm run import:dannet -- --source C:\tmp\ord-dsl\dannet-csv
```

Det genererede katalog ligger i `public/katalog/v1` og er ignoreret i git. Hvis kataloget mangler, bruger appen et lille udviklingskatalog.

I production er den valgte strategi at generere kataloget i Vercel build. Sæt:

```text
ORD_IMPORT_DANNET=true
ORD_DANNET_URL=https://wordnet.dk/export/csv/dn
```

Buildscriptet downloader DanNet CSV-eksporten, udpakker den i `.ord-dev/dannet-csv` og genererer `public/katalog/v1`, hvis kataloget ikke allerede findes.

Importen filtrerer afkortede definitioner væk som standard, så appen ikke viser flashcards med forklaringer der stopper ved `…`.
