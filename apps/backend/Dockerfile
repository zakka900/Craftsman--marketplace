# syntax=docker/dockerfile:1

# Two-stage build: the first stage compiles (devDependencies included, needs the
# prisma CLI and nest CLI), the second stage only runs the compiled output.
#
# Note: `npm ci` installs the entire monorepo (including apps/mobile) instead of
# limiting itself to the backend workspace — the image ends up heavier than
# necessary, but npm workspaces resolution is guaranteed correct. Deliberate
# choice for a portfolio project: correctness before image-size optimization.
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/admin/package.json apps/admin/package.json
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
