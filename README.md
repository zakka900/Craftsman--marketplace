# Artisan Marketplace — App Cliente (GCC)

Marketplace che collega clienti e artigiani nei paesi del Golfo (SA, AE, QA, KW).
Monorepo: app mobile Expo/React Native + backend NestJS (skeleton) + package condiviso.

## Struttura

- `apps/mobile` — App Cliente completa (Expo, TypeScript). Funziona **subito senza backend** grazie al layer mock (`src/services/api.ts`).
- `apps/backend` — Skeleton NestJS con moduli isolati e provider astratti (OTP, Open Banking, Pagamenti, AI) + schema Prisma completo.
- `packages/shared` — Tipi, costanti (paesi, città, categorie), validazioni condivise.

## Avvio rapido (app mobile)

```bash
cd apps/mobile
npm install
npx expo start
```

Apri con Expo Go (iOS/Android) o simulatore.

**Codice OTP demo: `123456`** (mock, vale per telefono ed email).

## Backend (skeleton)

```bash
cd apps/backend
npm install
cp .env.example .env
npx prisma generate
npm run start:dev
```

I moduli backend usano storage in-memory con TODO chiari per collegare Prisma/PostgreSQL
e i provider reali (Unifonic/Twilio per OTP, Lean per Open Banking, Tap Payments, Claude API).

## Lingue e RTL

i18n con Inglese e Arabo. Cambiando lingua in Profilo → Lingua, l'app applica RTL
(serve riavvio dell'app per lo specchiamento completo, comportamento standard React Native).

## Note

- Tutti i pagamenti, verifiche bancarie e analisi AI sono **simulati** in questa versione,
  dietro interfacce sostituibili (vedi commenti `// PROVIDER REALE:` nel codice).
- I preventivi degli artigiani arrivano automaticamente (simulati) ~10–25s dopo l'invio
  di una richiesta, per poter testare l'intero flusso end-to-end.
