# Deployment

Ord deployes som en Next.js-app på Vercel. Dette dokument er både en
trin-for-trin-plan til den første opsætning og et opslagsværk til
miljøvariabler og konfigurationsdetaljer.

## Trin-for-trin opsætning

Rækkefølgen er valgt så hver afhængighed kan testes inden den næste
lægges ovenpå. Hele forløbet tager ca. 60-90 minutter første gang.

### Trin 1 — Azure Storage-konto (5-10 min)

1. Log ind på <https://portal.azure.com>.
2. Klik **Create a resource** → søg på *Storage account* → **Create**.
3. Udfyld:
   - **Subscription**: din egen.
   - **Resource group**: opret ny `ord-prod` (eller brug eksisterende).
   - **Storage account name**: fx `ordklimenko` (3-24 alfanumeriske, globalt unikt).
   - **Region**: `North Europe` eller `West Europe`.
   - **Performance**: Standard.
   - **Redundancy**: LRS (lokalt redundant — billigst, fint til en lille app).
4. Klik **Review + create** → **Create**. Vent 1-2 minutter.
5. Når den er oprettet: åbn kontoen → **Security + networking** → **Access keys** → kopiér **Connection string** under key1. Gem den til trin 5.
6. Tabellen `OrdUserData` oprettes automatisk af appen ved første brug. Du behøver ikke oprette den manuelt.

### Trin 2 — Auth0-applikation (10 min)

1. Log ind på <https://manage.auth0.com> (opret konto hvis du ikke har en).
2. Hvis du ikke allerede har en tenant, opret én — fx `klimenko.eu.auth0.com` (vælg EU-region for nærhed/GDPR).
3. **Applications** → **Create Application**:
   - **Name**: `Ord`
   - **Type**: *Regular Web Applications*
4. På fanen **Settings**, find disse felter under **Application URIs** og udfyld:
   - **Allowed Callback URLs**: `https://ord.klimenko.dk/auth/callback`
   - **Allowed Logout URLs**: `https://ord.klimenko.dk`
   - **Allowed Web Origins**: `https://ord.klimenko.dk`
   - **Application Login URI**: `https://ord.klimenko.dk/auth/login`
5. Klik **Save Changes** nederst på siden (let at glemme).
6. Øverst på Settings-fanen, kopiér disse tre værdier til trin 5:
   - **Domain** (fx `klimenko.eu.auth0.com` — ingen `https://`, ingen `/` til sidst)
   - **Client ID**
   - **Client Secret** (klik *Show* eller copy-ikonet)

### Trin 3 — Generer AUTH0_SECRET (1 min)

Auth0 SDK'et bruger en lokal hemmelighed til at signere session-cookies. Generer 32 bytes (64 hex-tegn):

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Gem outputtet til trin 5.

### Trin 4 — Vercel-projekt og første deploy (10 min)

1. Log ind på <https://vercel.com>.
2. **Add New** → **Project** → vælg dit Git-repo for `ord`.
3. Standardindstillinger virker:
   - **Framework Preset**: Next.js (auto-detekteret)
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
   - **Output Directory**: lad være tom (Next.js default)
4. **Inden første deploy**: udfyld *Environment Variables* i opsætningsskærmen — se trin 5 for hele listen.
5. Klik **Deploy**. Buildet downloader DanNet (CC BY-SA) og DSL's frekvensliste, genererer kataloget og bygger Next.js-appen. Forvent 3-5 minutter.
6. Når den er grøn, åbn `*.vercel.app`-URL'en. Vis-svar/Enter-flowet skal virke; login virker først efter trin 6.

### Trin 5 — Miljøvariabler (sættes i Vercel før første deploy)

I Vercels environment-vælger, vælg kun **Production**. Lad *Preview* og *Development* stå tomme. Auth0-callback'en peger kun på `https://ord.klimenko.dk`, så preview-deploys på `*.vercel.app` ville fejle login alligevel, og det er bedre at preview-deploys ikke skriver til den samme Azure-tabel som produktion.

Du kan kopiere bloken her og indsætte i Vercels *Bulk Edit*:

```text
APP_BASE_URL=https://ord.klimenko.dk
ORD_STORAGE_MODE=azure
ORD_IMPORT_DANNET=true
AZURE_STORAGE_CONNECTION_STRING=<fra trin 1>
AUTH0_SECRET=<fra trin 3>
AUTH0_DOMAIN=<fra trin 2, fx klimenko.eu.auth0.com>
AUTH0_CLIENT_ID=<fra trin 2>
AUTH0_CLIENT_SECRET=<fra trin 2>
```

Gotchas:
- `AUTH0_DOMAIN`: kun værtsnavnet, ingen `https://`, ingen efterstillet `/`.
- `APP_BASE_URL`: skal indeholde `https://` og må ikke ende på `/`.
- `ORD_STORAGE_MODE=azure` er vigtig: uden den ville auto-mode falde tilbage til den lokale fil-storage hvis Azure-creds blev læst forkert. I prod vil vi fejle hellere end skjule fejlen.
- Azure-creds kan alternativt sættes som `AZURE_STORAGE_ACCOUNT` + `AZURE_STORAGE_ACCESS_KEY` hvis du foretrækker det fremfor connection-strengen.

### Trin 6 — Custom domain (5 min + DNS-ventetid)

1. Vercel-projektet → **Settings** → **Domains** → **Add** → indtast `ord.klimenko.dk`.
2. Vercel viser en DNS-instruktion. Typisk:
   - **CNAME** `ord.klimenko.dk` → `cname.vercel-dns.com`
3. Sæt CNAME'en i din DNS-udbyder for `klimenko.dk`.
4. Vent på DNS-propagation (5-30 minutter typisk, op til 48 timer maks). Vercel viser status og udsteder Let's Encrypt-cert automatisk.
5. Når domænet er grønt, redeploy projektet (Settings → Deployments → kør seneste igen) så `APP_BASE_URL` bruger det nye domæne fuldt ud.

### Trin 7 — Smoke test (5 min)

1. Åbn <https://ord.klimenko.dk> → forventet: redirect til `/auth/login`.
2. Klik dig gennem Auth0-flowet (sign up første gang).
3. Du lander på trænerens forside med et kort.
4. Tryk `Enter` → definitionen vises. Tryk `Enter` igen → svaret gemmes som rigtigt og næste kort vises.
5. Klik `Statistik` i toppen → forventet: tabellen og søjlediagrammet viser dagens svar.
6. Klik `Fortryd sidste svar` (synlig kort efter et svar) → tæller går tilbage.
7. Reload siden → progressionen er stadig der (verificerer Azure Table Storage).

### Trin 8 — Lokal udvikling mod produktion-Auth0 (valgfrit)

Hvis du vil teste login-flowet lokalt:

1. I Auth0-applikationens Settings, tilføj også til *Allowed Callback URLs* og *Allowed Logout URLs*:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000`
2. Lav en `.env.local` med samme variabler som production, men `APP_BASE_URL=http://localhost:3000` og `ORD_STORAGE_MODE=auto` (så lokal udvikling falder tilbage til fil-storage hvis du ikke vil bruge en separat dev-Azure-konto).

## Forventede omkostninger

- **Vercel Hobby**: 0 kr/md ved <100 GB bandwidth/md (rigeligt for en lille træningsapp).
- **Azure Storage LRS**: 0,02 USD/GB/md + 0,50 USD/million transaktioner. En enkelt bruger med daglig brug ligger typisk under 0,10 USD/md.
- **Auth0 Free**: 0 kr/md op til 7.500 aktive brugere.

## Reference

### Vercel

Projektet kan oprettes som et almindeligt Vercel-projekt med standardindstillinger for Next.js:

- install command: `npm install`
- build command: `npm run build`
- output: Next.js standard
- production domain: `ord.klimenko.dk`

### Miljøvariabler

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

### Auth0

Auth0-applikationen skal have disse URL'er:

- Allowed Callback URLs: `https://ord.klimenko.dk/auth/callback`
- Allowed Logout URLs: `https://ord.klimenko.dk`
- Allowed Web Origins: `https://ord.klimenko.dk`
- Application Login URI: `https://ord.klimenko.dk/auth/login`

Lokalt kan følgende URL'er også tilføjes:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000`

### Azure Table Storage

Appen opretter tabellen automatisk, hvis den ikke findes. Den bruger én partition pr. bruger og rækker med disse prefixes:

- `card:` for repetitionsstatus pr. kort
- `day:` for daglige statistikaggregater
- `evt:` for svarhistorik

Storage keys må kun ligge i servermiljøet. Browseren må ikke få direkte skriveadgang til Azure Storage.

### DanNet-katalog

Lokalt genereres kataloget med:

```powershell
npm run import:dannet -- --source C:\tmp\ord-dsl\dannet-csv --frekvens C:\tmp\ord-dsl\freq\lemma-30k-2017.txt
```

Det genererede katalog ligger i `public/katalog/v1` og er ignoreret i git. Hvis kataloget mangler, bruger appen et lille udviklingskatalog.

I production er den valgte strategi at generere kataloget i Vercel build. Sæt:

```text
ORD_IMPORT_DANNET=true
ORD_DANNET_URL=https://wordnet.dk/export/csv/dn
ORD_FREKVENS_URL=https://korpus.dsl.dk/download/lemma-10k.zip
```

Buildscriptet downloader DanNet-eksporten til `.ord-dev/dannet-csv` og DSL's åbne frekvensliste til `.ord-dev/freq`, og genererer `public/katalog/v1`, hvis kataloget ikke allerede findes. Hvis frekvenslisten ikke kan hentes, bygges kataloget uden frekvens, så build ikke fejler.

Importen beholder afkortede definitioner og markerer dem med et `afkortet`-flag. UI'en gør slut-`…` til et link til DanNet-synsettet, så brugeren kan klikke videre til den fulde forklaring.
