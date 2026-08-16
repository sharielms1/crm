# CRM Comp AI — montaje para Carryt (reclutamiento de choferes)

> Sistema **APARTE** de la app Carryt: trae su propia base, no toca la DB ni el
> código de Carryt. Montado por la terminal IMPLEMENTACION-DE-VIDEOS el
> 10-ago-2026 (DECISION_CRM_COMPAI_MONTAR_10AGO). Repo:
> github.com/trycompai/crm (MIT), commit fijo `d585dc3`.

## ✅ Lo que YA quedó hecho (sin llaves del founder)
- Repo clonado a un commit fijo (auditada su historia: org real, sin postinstall
  malicioso; único hook es `pre-push`, inofensivo).
- Dependencias instaladas (`bun install --ignore-scripts`) + **cliente Prisma
  generado** (`bunx prisma generate` — el postinstall normal falla en bun+Windows
  porque Prisma corre bajo Node y no resuelve `effect`; con `bunx` sí).
- `.env` escrito con los **controles legales** ya aplicados (ver abajo).

## 🔴 Controles legales aplicados en el `.env` (NO relajar sin la neurona legal)
Del video #6 (DPA) — PLAN_TERMINAL_VIDEOS_V6_DPA_10AGO:
1. **Solo datos SEMILLA hoy.** Datos REALES de aspirantes SOLO después de
   actualizar la política de privacidad (borrador listo:
   `carryt/docs/legal/borradores/2026-08-10-clausula-resend-sentry-y-nota-72h.md`
   → abogado RD). El seed es el del propio repo (`bun run db:seed`), nada de
   copiar aspirantes reales de la waitlist.
2. **LinkedIn/RapidAPI y Perplexity: APAGADOS** (comentados en `.env`). La
   172-13 exige informar al titular antes de enriquecer desde otra fuente.
3. **Cero datos sensibles:** antidoping (salud) y antecedentes penales JAMÁS
   entran a este CRM — viven solo en el flujo de verificación de Carryt.
4. **Llaves dedicadas de mínimo privilegio**, nunca las de producción de Carryt.
5. `ALLOWED_SIGN_IN` es UNA dirección, no un dominio (un dominio admite a
   cualquiera de ese dominio y sus subdominios — riesgo real).
6. Telemetría anónima del CRM: apagada.

## ⏳ Lo que FALTA — todo depende del founder (3 llaves + 1 decisión)
El CRM **NO está resuelto** todavía: montado local a medias, pero el dolor real
("los aspirantes caen en lista muerta") solo se cierra cuando esté **desplegado**
y el **formulario de choferes lo alimente**. Ambas cosas son tuyas.

### Decisión: ¿dónde vive?
- **A · Local en tu PC (para probarlo):** iniciar **Docker Desktop** (OJO,
  verificado 15-ago: ya NO está instalado en esta PC — solo quedan logs viejos
  del instalador; habría que reinstalarlo), luego `docker compose up -d`
  levanta el Postgres, y
  `bun run db:deploy && bun run db:seed && bun run dev` lo abre en
  `localhost:3000`. Gratis, pero solo lo ves tú en tu máquina.
- **B · Nube (su hogar real):** Neon (Postgres free tier) + Vercel (free tier,
  el host que el repo espera). Nada que instalar en tu PC, build en Linux (sin
  el snag de bun+Windows), y queda con URL pública para conectar el formulario.
  Requiere una cuenta Neon y una Vercel (gratis).

### Las 2 llaves que hacen falta en CUALQUIER caso
- **Google OAuth dedicado** (`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`): un
  cliente OAuth NUEVO en tu Google Cloud (consent screen propio, redirect a la
  URL del CRM), mínimo privilegio. Es también lo que lee Gmail/Calendario.
- **`AI_GATEWAY_API_KEY`** (motor IA del agente, vía Vercel AI Gateway): sin
  ella la app monta pero los agentes no investigan leads.

## 🛡️ Revisión de seguridad (10-ago, pedida por el founder) — SIN debilidades
Verificado en la config que dejé y en el código del repo:
- **Secretos:** `.env` está gitignoreado y NO trackeado (nunca se sube). Cero
  llaves de Carryt filtradas (verificado). `BETTER_AUTH_SECRET` fuerte y único.
- **Login:** `ALLOWED_SIGN_IN` es UNA dirección (un dominio dejaría entrar a
  cualquiera del dominio). Sin OAuth aún = nadie entra.
- **Falla CERRADO por diseño (lo confirmé en el código):** el endpoint de sync
  de correo **se niega a correr si falta `CRON_SECRET`** y compara el token en
  tiempo constante (`timingSafeEquals`, anti-timing-attack). La interfaz de
  agente está APAGADA sin `AGENT_BRIDGE_SECRET` ("unset means no bridge, not an
  open one"). Nada queda abierto por olvido.
- **Enriquecimiento externo (LinkedIn/Perplexity) y motor IA: apagados.**
  Telemetría: apagada. Datos sensibles: fuera del esquema.

### Seguridad al DESPLEGAR en Vercel+Neon (musts, los aplico contigo)
1. **Todos los secretos van en las Environment Variables de Vercel**, jamás en
   git. El `.env` local se queda local.
2. **Neon:** cadena con SSL obligatorio; NO exponer `db:studio` en público.
3. **Google OAuth:** cliente DEDICADO, redirect bloqueado SOLO a la URL de
   Vercel, y los permisos mínimos de Gmail/Calendario (no pedir de más).
4. **`CRON_SECRET`** de 16+ caracteres para el sync de correo, y el scheduler
   atado a él.
5. LinkedIn/Perplexity siguen APAGADOS hasta que la política de privacidad se
   actualice (línea roja legal).

## Camino NUBE elegido (Neon + Vercel) — pasos (te guío)
> ⚠️ **Superado en parte el 15-ago:** la app y la DB sí quedaron en Vercel+Neon,
> pero el MOTOR (`apps/api`) NO arranca en Vercel. Para el motor, ver la sección
> **DESPLIEGUE 1-CLICK** al final.
1. Cuenta gratis en **Neon** → crear proyecto Postgres → copiar la cadena de
   conexión (pooled, con `sslmode=require`).
2. Cuenta gratis en **Vercel** → importar el repo → en Settings/Environment
   Variables pegar: `DATABASE_URL` (Neon), `BETTER_AUTH_SECRET` (el del `.env`),
   `ALLOWED_SIGN_IN`, `GOOGLE_CLIENT_ID/SECRET`, `AI_GATEWAY_API_KEY`,
   `CRON_SECRET`, `CRM_TELEMETRY_DISABLED=1`.
3. Google Cloud → crear el cliente OAuth dedicado con el redirect de Vercel.
4. Deploy. Luego `bun run db:deploy` contra Neon + `db:seed` (datos de prueba).
5. Después (fase 2): conectar el formulario de choferes de Carryt para que los
   aspirantes entren solos — ESE es el objetivo real, y va tras actualizar la
   política.

## Comandos (referencia, cuando haya DB)
```sh
cd C:/Users/shari/comp-crm
docker compose up -d            # (path A) levanta Postgres local
bun run db:deploy               # crea el esquema
bun run db:seed                 # datos SEMILLA (del repo, no reales)
bun run dev                     # app en :3000, API en :3001
```

## 🚀 DESPLIEGUE 1-CLICK del motor (preparado 15-ago)

Estado al 15-ago: la **app web ya vive en Vercel** (crm-app-omega-sepia.vercel.app)
y la **DB en Neon** (esquema desplegado + 15 empresas semilla). El **motor**
(`apps/api`, NestJS sobre Bun) NO arranca en Vercel — 5 vías probadas contra el
empaquetado del monorepo bajo runtime Bun. Este bloque deja las 3 vías con
Docker LISTAS; **la decisión del host es del founder**. Nada está desplegado.

### Qué quedó escrito (en este repo)
- `apps/api/Dockerfile` — imagen del motor: `oven/bun:1.3.14`, install
  congelado del monorepo con `--ignore-scripts` (misma postura de seguridad del
  montaje), `prisma generate` explícito, `bun src/main.ts`, `/health` como
  healthcheck, corre como usuario sin privilegios.
- `.dockerignore` (raíz) — ni `.env` ni `node_modules` ni el cliente Prisma de
  Windows entran a la imagen.
- `railway.json` · `render.yaml` · `fly.toml` — los 3 hosts apuntando al MISMO
  Dockerfile, cada uno con su health check en `/health`.

### Lo probado el 15-ago (evidencia, no opinión)
- `bun install --frozen-lockfile --ignore-scripts` → **"no changes"** (el
  lockfile está íntegro: el install dentro de la imagen no va a sorprender).
- `bunx prisma generate` con URL dummy → **generó en 502ms sin tocar la DB**
  (el paso de build no necesita red ni credenciales).
- `bun src/main.ts` local → **`/health` HTTP 200 `{"status":"ok","database":"up"}`
  contra la Neon VIVA**, listo a los 14s de arrancar.
- ⚠️ **`docker build` NO se corrió: Docker ya no existe en esta PC** (Docker
  Desktop fue desinstalado — sin binarios, sin registro, sin distros WSL). No
  se inventó una prueba que no hubo: el Dockerfile es single-stage justamente
  para minimizar lo no-probado, y cada RUN se verificó 1:1 en local. El primer
  build real lo hará el host elegido (los 3 construyen ellos la imagen).

### Las 6 variables (valores en `C:/Users/shari/comp-crm/.env` — JAMÁS en git)
| Variable | Qué pegar / de dónde sale |
|---|---|
| `DATABASE_URL` | La de Neon que ya está en el `.env` (conexión directa). Si algún día hay varias instancias, usar la *pooled* de Neon (mismo host con `-pooler`). |
| `BETTER_AUTH_SECRET` | La del `.env`. |
| `ALLOWED_SIGN_IN` | La del `.env` (UNA dirección — regla legal del 10-ago). |
| `APP_URL` | `https://crm-app-omega-sepia.vercel.app` |
| `API_URL` | La URL pública que el host le asigne al motor. Es de **segunda pasada**: primero deploy, copiar la URL, pegarla, redeploy. |
| `CRM_TELEMETRY_DISABLED` | `1` — ya viene puesta en render.yaml y fly.toml; en Railway pegarla a mano. |

### Prerrequisito SOLO para los caminos A y B: subir estos archivos a GitHub
Railway y Render despliegan **desde GitHub**, y el Dockerfile + configs viven
solo en esta carpeta local. El repo del founder ya existe (fork
`sharielms1/crm`, remote `fork` de esta carpeta), pero su rama `release` está
en otro commit que la local — para no pelear con eso, va en rama propia:
```sh
cd C:/Users/shari/comp-crm
git checkout -b deploy-motor
git add apps/api/Dockerfile .dockerignore railway.json render.yaml fly.toml MONTAJE-CARRYT.md
git commit -m "feat(deploy): motor del CRM listo para Railway/Render/Fly via Docker"
git push fork deploy-motor
```
En Railway/Render se elige el repo `sharielms1/crm` y la **rama `deploy-motor`**.
(El camino C no necesita nada de esto: `fly deploy` sube esta carpeta tal cual.)

### Camino A · Railway (~US$5/mes plan Hobby; no se duerme)
1. Cuenta en railway.com (login con GitHub).
2. New Project → **Deploy from GitHub repo** → este repo. Railway lee
   `railway.json` solo (Dockerfile + healthcheck ya configurados).
3. En **Variables** pegar las 6 de arriba (API_URL puede esperar al paso 4).
4. Settings → Networking → **Generate Domain** → copiar esa URL → pegarla como
   `API_URL` → Railway redespliega solo al cambiar la variable.

### Camino B · Render (GRATIS, pero se duerme a los 15 min sin tráfico; el 1er request luego tarda ~1 min)
1. Cuenta en render.com (login con GitHub).
2. New → **Blueprint** → este repo. Render lee `render.yaml` y pide en pantalla
   las variables marcadas `sync: false`.
3. Al terminar el primer deploy, copiar la URL `*.onrender.com` → pegarla en
   `API_URL` → Save (redespliega solo).
   *(Si el sueño molesta: subir a plan starter, US$7/mes.)*

### Camino C · Fly.io (sin free tier; con auto-stop sale en ~US$2-3/mes o menos; pide tarjeta al crear cuenta)
1. Cuenta en fly.io + instalar `flyctl`.
2. Desde `C:/Users/shari/comp-crm`: `fly launch --no-deploy` (si ofrece
   regenerar el fly.toml, decir **NO** — ya está escrito).
3. `fly secrets set DATABASE_URL="..." BETTER_AUTH_SECRET="..." ALLOWED_SIGN_IN="..." APP_URL="https://crm-app-omega-sepia.vercel.app" API_URL="https://carryt-crm-api.fly.dev"`
   *(Los nombres de app en Fly son globales: si `carryt-crm-api` está tomado,
   `fly launch` obliga a otro nombre — usar entonces ese nombre en `API_URL`.)*
4. `fly deploy`.

### Paso final (igual para los 3): apuntar la app de Vercel al motor nuevo
1. vercel.com → proyecto de la **APP** (el de crm-app-omega-sepia, NO el
   proyecto crm-api fallido) → Settings → Environment Variables → crear/editar
   **`API_URL`** = URL nueva del motor.
2. Deployments → **Redeploy**. Obligatorio: esa URL queda **horneada** en el
   build de Next (`NEXT_PUBLIC_API_URL`); cambiar la variable sin redeploy no
   cambia nada.

El navegador **nunca** habla directo con el motor: la app lo proxea en su mismo
origen (`apps/app/app/api/[...path]/route.ts`), así que **no hay CORS que
configurar** en ningún host. `APP_URL` sí es obligatoria: es el trusted origin
de better-auth.

### Notas para después (no bloquean el deploy)
- **Google OAuth (cuando el founder cree el cliente):** el redirect es
  `<API_URL>/api/auth/callback/google` — crearlo cuando ya se sepa la URL del
  motor, y pegar `GOOGLE_CLIENT_ID/SECRET` en el host + redeploy.
- **Crons:** en Vercel había 3 rutas programadas (`/internal/sync/mailboxes`,
  `/internal/sync/rates`, `/internal/telemetry/rollup`). Ningún host las llama
  solo. **Pendiente hasta activar el OAuth** (sin él no hay buzones que
  sincronizar). Cuando toque: un cron del host (Railway cron / Render Cron Job /
  GitHub Actions) haciendo POST con `Authorization: Bearer $CRON_SECRET`, y
  setear `CRON_SECRET` (16+ chars) en el motor.
- **Migraciones futuras:** `bun run db:deploy` desde esta PC contra Neon (usa
  la URL directa del `.env`; ese comando no tiene el candado de "solo local").

---

## ✅ ESTADO 16-ago-2026 (madrugada) — el código YA está en GitHub

**HECHO (MAIN, sin intervención del founder salvo el login de git):**
- Rama **`deploy-motor`** subida al fork `sharielms1/crm`, commit `ca8690d`
  (verificado contra el remoto con `git ls-remote`). Lleva: `apps/api/Dockerfile`,
  `.dockerignore`, `render.yaml`, `railway.json`, `fly.toml` y el `.gitignore`
  con `.env*`.
- **Escaneo de secretos antes de subir: LIMPIO** (el fork es PÚBLICO — es un
  fork de un repo open source). Lo único que parece credencial en el Dockerfile
  es la URL de relleno `postgresql://build:build@localhost` que Prisma exige
  para generar el cliente en tiempo de build; no toca red ni datos.
- Verificado que `apps/api/src/main.ts` escucha en `process.env.PORT` — el
  fallo #1 de los despliegues en Render (si no lo respeta, Render mata el
  servicio por "no port detected"). Aquí sí lo respeta.
- NO se subió `MONTAJE-CARRYT.md` (este archivo) ni `apps/api/src/server.ts`:
  el primero es documentación interna de Carryt y el repo es público; el
  segundo era el puente del intento por Vercel, que quedó superado.

**LO QUE FALTA, y por qué NO lo puede hacer el asistente:**
1. **Entrar a Render** (`dashboard.render.com`) → botón **GitHub**. Crea la
   cuenta Y conecta el repo de un solo golpe. *El asistente no crea cuentas ni
   teclea contraseñas: regla dura, no se salta ni con permiso.*
2. Dentro: **New → Blueprint** → elegir el repo `sharielms1/crm` y la rama
   **`deploy-motor`** → Render lee `render.yaml` solo.
3. Pegar las 5 variables (los valores están en `C:/Users/shari/comp-crm/.env`;
   **las pega el founder**, son secretos): `DATABASE_URL`, `BETTER_AUTH_SECRET`,
   `ALLOWED_SIGN_IN`, `APP_URL` = `https://crm-app-omega-sepia.vercel.app`.
   `API_URL` va en segunda pasada (ver abajo). `CRM_TELEMETRY_DISABLED` ya
   viene puesta en el blueprint.
4. **Segunda pasada** (en cuanto Render dé la URL pública, tipo
   `https://crm-api-xxxx.onrender.com`): pegarla en `API_URL` del propio
   servicio → redeploy; y en **Vercel**, cambiar `API_URL` del proyecto de la
   app y **redesplegar** (queda horneada en el build como `NEXT_PUBLIC_API_URL`).
5. Plan **free**: se duerme a los ~15 min sin tráfico y el primer request luego
   tarda ~1 min. Decidido así por la regla GRATIS-FIRST del founder; el plan
   que no duerme (~US$5-7/mes) quedó congelado en `PLAN_POST_INGRESOS`.

### ⚠️ TRAMPA MEDIDA (16-ago, madrugada): la vía "Public Git Repository" NO sirve para este repo
Render se queda colgado validando `https://github.com/sharielms1/crm` por URL
pública — probado DOS veces (Blueprint y Web Service), esperando >5 min cada
una: la página nunca vuelve a estar lista (el clon del monorepo con ~50 ramas
no termina). No se creó nada duplicado; el panel quedó limpio.
**La vía buena es conectar la cuenta de GitHub** (Render lee por la API en vez
de clonar a ciegas). Al autorizar, elegir **"Only select repositories" → solo
`crm`** — nunca "All repositories" (mínimo privilegio).
La ventana de autorización de GitHub la abre el navegador FUERA del control del
asistente: ese clic es del founder, siempre.

### 🚀 DESPLEGADO EN RENDER (16-ago-2026, 10:31)
- Servicio **`carryt-crm-motor`** · workspace "shariel's workspace" · plan **Free**
  · región Oregon (US West) · `srv-da0sjbbl550s73e9lkr0`.
- **URL del motor: `https://carryt-crm-motor.onrender.com`**
- Config: **Docker** · rama `deploy-motor` (commit `ca8690d`) ·
  Dockerfile `./apps/api/Dockerfile` · **Root Directory VACÍA** (el contexto
  tiene que ser la raíz del monorepo o el install del workspace falla) ·
  health check `/health`.
- Conexión a GitHub por **cuenta conectada con acceso a UN SOLO repo** (`crm`),
  no "All repositories". La vía "Public Git Repository" NO sirve: cuelga la
  página al validar este monorepo (probado 2 veces, >5 min).
- Variables puestas por el asistente: `APP_URL`, `CRM_TELEMETRY_DISABLED=1`.
  Puestas por el founder (secretos, el asistente NO teclea credenciales):
  `DATABASE_URL`, `BETTER_AUTH_SECRET`, `ALLOWED_SIGN_IN`.
- **PENDIENTE (2ª pasada):** `API_URL` con la URL que Render asigne + redeploy,
  y la misma URL en la variable `API_URL` del proyecto de Vercel + **redeploy
  de Vercel** (queda horneada en el build como `NEXT_PUBLIC_API_URL`).

### ✅ PUNTA A PUNTA VERIFICADO (16-ago) + la trampa que costó un ciclo
`crm-app-omega-sepia.vercel.app/api/health` devuelve la MISMA respuesta que el
motor directo (voz de NestJS con requestId) → el proxy llega al motor. El motor
en su ruta real `/health` da `{"status":"ok","database":"up"}`.

⚠️ **Cambiar `API_URL` en Vercel NO bastó.** `apps/app/next.config.ts` mapea
`API_URL` → `NEXT_PUBLIC_API_URL` en build, pero `apps/app/turbo.json` tiene
`API_URL` en **passThroughEnv** (no invalida caché) y `NEXT_PUBLIC_API_URL` en
**env** (sí invalida). El redeploy reusó el build cacheado con
`http://localhost:3001` horneado. **Solución: definir `NEXT_PUBLIC_API_URL`
directo en Vercel + redeploy.** Regla reusable: en Turborepo, tocar una variable
de `passThroughEnv` puede no reconstruir nada.

---

## 🔎 16-ago (tarde) — crons montados y el nudo REAL del Google OAuth

### Crons: LISTOS (gratis)
`.github/workflows/carryt-crons.yml` llama las 3 rutas por horario. **GitHub
Actions y no Render Cron porque el de Render es de pago**, y la regla es la vía
gratis mientras no haya ingresos. De paso despierta al motor dormido.

Medido antes de escribirlo: las 3 rutas devuelven **503**, que en
`rates.controller.ts:42` significa exactamente *falta `CRON_SECRET`* — no un
fallo. Un **403** significaría que sí está puesto pero el token no coincide. El
workflow traduce cada código a su causa en el registro.

Falta del founder: encender Actions en el fork (GitHub deja los workflows
programados APAGADOS en los forks), poner `CRON_SECRET` en Render, y guardar el
MISMO valor como secreto del repositorio.

### Google OAuth: el problema no es crear el cliente, son los PERMISOS

Investigado a fondo hoy, y no es lo que parecía:

1. **`emailAndPassword: { enabled: false }`** (`packages/auth/src/auth.ts:63`).
   La ÚNICA puerta de entrada es Google (o Microsoft). Sin OAuth **nadie puede
   entrar al CRM** — está desplegado y sano, pero inaccesible.
2. Los permisos que pide al entrar son **`gmail.readonly` + `calendar.readonly`**
   (`packages/auth/src/scopes.ts:13-18`). `gmail.readonly` es un permiso
   **RESTRINGIDO** de Google: un app en producción con ese permiso exige
   verificación con auditoría de seguridad (CASA), que **cuesta dinero todos los
   años**. Choca con la regla gratis-first.
3. **No se pueden simplemente quitar.** `requireMailboxAccess()` protege
   `apps/app/app/(app)/[slug]/layout.tsx`, o sea TODA la app autenticada: si
   falta el permiso, redirige a `/grant-access` en bucle. Quitar el permiso sin
   tocar ese guard deja el CRM igual de inaccesible.

**Las dos salidas gratis, y su costo real:**

| | Modo "Prueba" de Google | Parchear el fork |
|---|---|---|
| Qué se hace | Consent screen External + Testing, él como usuario de prueba | Quitar `gmail.readonly` de los permisos de entrada **y** sacar el guard del layout |
| Cuesta | RD$0 | RD$0 |
| Entrar al CRM | Sí | Sí |
| Sincronizar correo | Sí, pero **el permiso caduca a los 7 días** (Google acorta el refresh token en modo Prueba) → reconectar cada semana | No (la función queda apagada, no borrada) |
| Riesgo | Ninguno; es el modo previsto para uso propio | Divergencia con el upstream: cada actualización del CRM hay que re-aplicar el parche |

**DECISIÓN DEL FOUNDER — pendiente.** Ninguna de las dos se puede tomar sola:
la primera cambia lo que él configura en Google Cloud, la segunda cambia código
de su fork y apaga una función.
