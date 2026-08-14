# Artisan Marketplace — App Cliente (GCC)

Marketplace che collega clienti e artigiani nei paesi del Golfo (SA, AE, QA, KW).
Monorepo: app mobile Expo/React Native + backend NestJS/Prisma (Postgres su Supabase, deploy su Railway) + package condiviso.

## Struttura

- `apps/mobile` — App Cliente completa (Expo, TypeScript). Ha anche un layer mock (`src/services/mockData.ts`) per lavorare offline, ma di default parla con il backend reale (`src/services/config.ts`).
- `apps/backend` — NestJS + Prisma, moduli isolati con provider astratti sostituibili (Stripe per i pagamenti, Gemini per l'AI, Lean per l'open banking).
- `packages/shared` — Tipi, costanti (paesi, città, categorie), validazioni condivise.

## Avvio rapido (app mobile)

```bash
cd apps/mobile
npm install
npx expo start
```

Apri con Expo Go (iOS/Android) o simulatore.

## Backend

```bash
cd apps/backend
npm install
cp .env.example .env   # compila DATABASE_URL/DIRECT_URL (Supabase), JWT_SECRET, ecc.
npx prisma generate
npx prisma db push     # sincronizza lo schema (nessuna cartella migrations: si usa db push)
npm run start:dev
```

Per creare l'account amministratore (nessun endpoint pubblico lo fa):

```bash
# imposta ADMIN_EMAIL / ADMIN_PASSWORD in apps/backend/.env, poi:
npm run prisma:seed-admin --workspace apps/backend
```

### Backend con Docker (setup locale one-command)

Alternativa a Node in locale: Postgres + backend containerizzati, nessuna
credenziale Supabase richiesta (usa un database locale usa-e-getta).

```bash
docker-compose up --build
```

L'API risponde su `http://localhost:3000/api`. Al primo avvio sincronizza
da solo lo schema Prisma sul Postgres locale.

## Test automatici

```bash
cd apps/backend
npm test          # 26 unit test (state machine, moderazione chat, fallback AI)
npm run test:e2e  # 6 test e2e sul flusso auth (Prisma finto in memoria, nessun DB reale coinvolto)
```

Pipeline CI (GitHub Actions) esegue build + entrambe le suite ad ogni push/PR su `main`.

## Moduli aggiunti per il portfolio

Sottoinsieme mirato di funzionalità, scelto per essere difendibile a fondo in un
colloquio tecnico piuttosto che coprire l'intero scope da startup (vedi
`SPECIFICHE_FUNZIONALITA_PORTFOLIO.md`).

**1. AI layer (Gemini, free tier)** — due usi concreti nel flusso, non un chatbot
generico: lato cliente rileva informazioni mancanti nella descrizione della richiesta
(`POST /ai/analyze-text`); lato professionista suggerisce cosa includere in un
preventivo (`POST /ai/suggest-quote`). Regola di prodotto imposta *a livello di
codice* (non solo di prompt): il `disclaimer` restituito è sempre una costante
lato server, mai testo generato dal modello — l'AI non dichiara mai un prezzo come
definitivo. Provider dietro un'interfaccia (`AiProvider`, vedi `modules/ai/`) con
fallback automatico al provider mock se `GEMINI_API_KEY` manca o la chiamata fallisce:
un suggerimento AI non deve mai rompere il flusso.

**2. Chat con moderazione base** — regex (non NLP) per rilevare numeri di telefono,
email, link WhatsApp/Telegram/Instagram e URL generici nei messaggi
(`common/contact-detector.ts`), bloccati finché il preventivo non è accettato
(`ARTISAN_SELECTED` in poi). Scelta deliberata: per un MVP la regex è più prevedibile
e verificabile di un classificatore NLP.

**3. Job Archive** — la `Request` è l'entità centrale (relazioni a Chat, Quote,
Payment, RequestEvent/Status History). Le transizioni di stato passano tutte da uno
state machine esplicito (`common/job-state-machine.ts`): nessun salto arbitrario è
possibile lato backend, indipendentemente da cosa arrivi dal client.

**4. Sicurezza base** — JWT + OTP via email (bcrypt, codici hashati sha256, TTL 10
minuti) già presenti; aggiunto: RBAC con `RolesGuard`/`@Roles()`, rate limiting
(5 tentativi/min) su login e verifica OTP (`@nestjs/throttler`), modulo Admin
(`/admin/disputes`) come primo endpoint realmente protetto da ruolo. **Nota di
scope**: il ruolo `Role` enum copre solo `CLIENT` e `ADMIN` — non esiste ancora
un'app/autenticazione per gli artigiani, quindi il ruolo `ARTISAN` non è stato
aggiunto ora (roadmap futura). Gli endpoint "lato artigiano" (invio preventivo,
suggerimento AI) restano aperti come già erano, in attesa di quell'app. La
protezione IDOR (un cliente non può leggere/modificare risorse di un altro) era già
presente ovunque tramite il pattern `own()` in ogni service, e resta lo standard per
qualunque nuovo endpoint.

**5. Traduzione EN/AR** — a differenza dell'i18n dell'interfaccia (già presente,
`src/i18n`), questa traduce i **contenuti generati dagli utenti** (messaggi chat,
descrizione richiesta) su richiesta dell'utente ("🌐 Translate" → "View original"),
con cache lato DB per (hash del testo, lingua target): la stessa traduzione non
richiama mai due volte l'AI. Il testo originale non viene mai sovrascritto.

### Roadmap futura (fuori scope qui, per scelta)

App/autenticazione professionisti (ruolo `ARTISAN`), reliability score, escrow
regolamentato, moduli AI avanzati (analisi foto via vision model), monetizzazione.

## Lingue e RTL

i18n con Inglese e Arabo. Cambiando lingua in Profilo → Lingua, l'app applica RTL
(serve riavvio dell'app per lo specchiamento completo, comportamento standard React Native).

## Note

- Pagamenti (Stripe, in test mode) e verifica bancaria (Open Banking) sono dietro
  interfacce sostituibili (vedi commenti `// PROVIDER REALE:` nel codice).
- I preventivi degli artigiani arrivano automaticamente (simulati) ~10–25s dopo l'invio
  di una richiesta, per poter testare l'intero flusso end-to-end senza un'app artigiani.
