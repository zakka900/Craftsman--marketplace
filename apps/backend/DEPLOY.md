# Deploy backend — Supabase + Railway + Stripe (test)

Checklist passo-passo. Tempo stimato: ~30 minuti.

---

## A) Database su Supabase

1. Vai su [supabase.com](https://supabase.com) → **New project**
   - Nome: `artisan` — scegli una **Database Password** forte e SALVALA
   - Region: `eu-central-1` (Francoforte, buona latenza verso UAE) o la più vicina
2. Quando il progetto è pronto: bottone **Connect** (in alto) → tab **ORMs** → **Prisma**
3. Copia le DUE stringhe mostrate:
   - `DATABASE_URL` (porta **6543**, con `?pgbouncer=true`) → connessione pooled per l'app
   - `DIRECT_URL` (porta **5432**) → connessione diretta per le migrazioni
4. Nel Mac: `cd ~/Desktop/app-clienti/apps/backend`, copia `.env.example` in `.env` e incolla le due stringhe (sostituisci `[YOUR-PASSWORD]` con la password del punto 1)
5. Genera il segreto JWT: `openssl rand -base64 32` → incollalo in `JWT_SECRET`
6. Installa e crea le tabelle su Supabase:

   ```bash
   npm install
   npx prisma db push
   ```

   Output atteso: "Your database is now in sync with your Prisma schema".
   Verifica su Supabase → **Table Editor**: devi vedere User, Request, Quote, Payment...

## B) Stripe (chiavi di TEST)

1. [dashboard.stripe.com](https://dashboard.stripe.com) → registrati → resta in **Test mode** (interruttore in alto)
2. **Developers → API keys** → copia la **Secret key** (`sk_test_...`) → `STRIPE_SECRET_KEY` nel `.env`
3. Webhook in locale (per sviluppo):

   ```bash
   brew install stripe/stripe-cli/stripe
   stripe login
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

   Il comando stampa un `whsec_...` → incollalo in `STRIPE_WEBHOOK_SECRET`
4. Test locale: `npm run start:dev` → l'API risponde su `http://localhost:3000/api`

## C) Deploy su Railway

1. Carica il progetto su GitHub (repo privato va bene):

   ```bash
   cd ~/Desktop/app-clienti
   git init && git add -A && git commit -m "backend production-ready"
   # crea il repo su github.com → poi:
   git remote add origin https://github.com/TUO-USERNAME/app-clienti.git
   git push -u origin main
   ```

2. [railway.app](https://railway.app) → login con GitHub → **New Project → Deploy from GitHub repo** → scegli `app-clienti`
3. Nel servizio → **Settings**:
   - **Root Directory**: `apps/backend`
   - Build command: `npm install && npm run build` (di solito auto-rilevato)
   - Start command: `npm run start:prod`
4. Tab **Variables** → aggiungi (stessi valori del `.env`, MA senza `OTP_DEV_CODE`):

   | Variabile | Valore |
   |---|---|
   | `DATABASE_URL` | stringa pooled Supabase (6543) |
   | `DIRECT_URL` | stringa diretta Supabase (5432) |
   | `JWT_SECRET` | il segreto generato |
   | `STRIPE_SECRET_KEY` | `sk_test_...` |
   | `STRIPE_WEBHOOK_SECRET` | vedi punto C6 |
   | `BREVO_API_KEY` | dashboard Brevo → SMTP & API → API Keys |
   | `MAIL_FROM` | mittente verificato su Brevo (es. `Artisan <no-reply@tuodominio.com>`) |
   | `NODE_ENV` | `production` |

   `PORT` la inietta Railway automaticamente: non impostarla.
5. **Settings → Networking → Generate Domain** → ottieni `https://xxx.up.railway.app`
   - Test: apri `https://xxx.up.railway.app/api/artisans` → deve rispondere `[]`
6. Webhook Stripe di produzione: Dashboard Stripe → **Developers → Webhooks → Add endpoint**
   - URL: `https://xxx.up.railway.app/api/payments/webhook`
   - Eventi: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
   - Copia il **Signing secret** (`whsec_...`) → variabile `STRIPE_WEBHOOK_SECRET` su Railway

## D) Email (verifica account)

Provider: [brevo.com](https://www.brevo.com) (gratis fino a 300 email/giorno).
Dashboard → **SMTP & API → API Keys** → crea una chiave → `BREVO_API_KEY` nel `.env`.
Importante: il mittente in `MAIL_FROM` deve essere un'email/dominio **verificato** su Brevo
(Dashboard → Senders, Domains & Dedicated IPs), altrimenti l'invio fallisce.
Senza `BREVO_API_KEY` configurata i codici OTP finiscono solo nei log (va bene per lo sviluppo).

---

## Note tecniche

- **Sicurezza webhook**: ogni notifica Stripe è verificata con firma digitale (`STRIPE_WEBHOOK_SECRET`); richieste non firmate → 400.
- **Astrazione pagamenti**: il codice dipende da `PaymentService` (interfaccia), Stripe è solo l'implementazione attuale (`stripe.service.ts`). Cambiare provider = 1 riga in `payments.module.ts`.
- **Escrow**: incasso su saldo piattaforma, stato `HELD_ESCROW`; il payout all'artigiano richiederà Stripe Connect (fase 2).
- **Nessuna chiave hardcoded**: tutto da variabili d'ambiente (`ConfigService.getOrThrow`).
- Ogni modifica futura allo schema: `npx prisma db push` di nuovo (o `prisma migrate dev` quando si passa alle migrazioni versionate).
