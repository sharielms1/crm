# Dockerfile del MOTOR del CRM (crm-api) — preparado 15-ago-2026 (tarea P5).
#
# CONTEXTO DE BUILD = LA RAÍZ DEL MONOREPO (no esta carpeta):
#   docker build -f apps/api/Dockerfile .
# Los tres configs de host (railway.json, render.yaml, fly.toml en la raíz)
# ya lo invocan así.
#
# Por qué single-stage: sin Docker en la máquina local no se pudo probar un
# multi-stage (poda --production + symlinks de workspaces entre stages son los
# dos puntos que fallan a ciegas). Esta forma es la de menos modos de fallo:
# cada RUN de abajo se verificó 1:1 en local el 15-ago (bun 1.3.14, Windows):
#   - `bun install --frozen-lockfile --ignore-scripts` → "no changes", lockfile íntegro
#   - `bunx prisma generate` con DATABASE_URL dummy → genera sin tocar red/DB
#   - `bun src/main.ts` → /health respondió {"status":"ok","database":"up"} contra Neon
#
# Se pinea 1.3.14 porque es el bun que escribió el bun.lock actual y con el que
# se probó todo. (package.json dice 1.3.12; si algún día el install congelado
# falla dentro de la imagen, lo primero es alinear este tag con el bun local.)
FROM oven/bun:1.3.14

WORKDIR /app

# ── 1 · Manifiestos primero (capa de caché del install) ──────────────────────
# Bun necesita el package.json de CADA workspace para resolver el lockfile,
# aunque después solo copiemos los fuentes del motor.
COPY package.json bun.lock turbo.json ./
COPY apps/api/package.json apps/api/
COPY apps/app/package.json apps/app/
COPY apps/agent/package.json apps/agent/
COPY packages/auth/package.json packages/auth/
COPY packages/db/package.json packages/db/
COPY packages/env/package.json packages/env/
COPY packages/telemetry/package.json packages/telemetry/
COPY packages/typescript-config/package.json packages/typescript-config/
COPY packages/ui/package.json packages/ui/

# --ignore-scripts: misma postura de seguridad del montaje local (ningún
# postinstall de terceros corre); lo único que los scripts hacían falta
# (prisma generate) se corre explícito abajo.
RUN bun install --frozen-lockfile --ignore-scripts

# ── 2 · Fuentes que el motor importa en runtime ──────────────────────────────
# apps/api (incluye src/generated/server.ts, que SÍ está en git) y los
# packages @crm/* de los que depende. apps/app y apps/agent no hacen falta.
COPY packages ./packages
COPY apps/api ./apps/api

# ── 3 · Cliente Prisma (packages/db/src/generated NO está en git) ────────────
# `prisma generate` no toca la base; la URL dummy existe solo porque
# prisma.config.ts exige que DATABASE_URL esté definida. No queda en la imagen.
RUN cd packages/db && DATABASE_URL="postgresql://build:build@localhost:5432/build" bunx prisma generate

ENV NODE_ENV=production

WORKDIR /app/apps/api

# El motor escucha process.env.PORT ?? 3001 (src/main.ts). Railway y Render
# inyectan su propio PORT; en Fly lo fija fly.toml.
EXPOSE 3001

# GET /health hace SELECT 1 contra la DB: si responde 200, motor Y base están vivos.
HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then((r)=>process.exit(r.ok?0:1),()=>process.exit(1))"

USER bun

CMD ["bun", "src/main.ts"]
