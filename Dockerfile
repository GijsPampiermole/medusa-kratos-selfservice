# Medusa's reskinned Ory Kratos self-service UI (Next.js, pages router).
# Multi-stage build producing a `next build` standalone runtime image.

FROM node:18-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# `npm install`, not `npm ci`: package-lock.json is currently out of sync
# with package.json (missing caniuse-lite@1.0.30001810), so `ci`'s strict
# check fails. --legacy-peer-deps: rollup-plugin-dts (only used by the
# unrelated `build:lib` npm-package target) peer-wants typescript ^4.1, but
# the project pins ^5.9.3 — irrelevant to the Next.js app itself.
# TODO: run `npm install` locally and commit the refreshed lock file, then
# switch this back to `npm ci --legacy-peer-deps` for reproducible builds.
RUN npm install --legacy-peer-deps

FROM node:18-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# `npm run build` runs the `prebuild` (design-token generation) hook first —
# see package.json.
RUN npm run build

FROM node:18-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 4455
ENV PORT=4455
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
