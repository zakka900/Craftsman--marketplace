# syntax=docker/dockerfile:1

# Build in due stadi: il primo compila (devDependencies incluse, serve prisma CLI
# e nest CLI), il secondo esegue solo l'output compilato.
#
# Nota: `npm ci` installa l'intero monorepo (anche apps/mobile) invece di limitarsi
# al workspace backend — l'immagine risulta più pesante del necessario, ma la
# risoluzione degli npm workspaces resta garantita corretta. Scelta deliberata per
# un progetto portfolio: correttezza prima dell'ottimizzazione della dimensione.
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/backend apps/backend
RUN npm run build --workspace apps/backend

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/package.json ./apps/backend/package.json

EXPOSE 3000
CMD ["node", "apps/backend/dist/main.js"]
