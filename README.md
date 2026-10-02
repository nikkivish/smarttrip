# SmartTrip

AI travel planning and women's safety. Plan a trip with an AI-generated, safety-aware
itinerary, then share your live location and emergency contacts for the whole journey.

```
safe-safar/
├── mobile/   Expo (React Native) + TypeScript + Expo Router
└── server/   Node + Express + TypeScript + Prisma (PostgreSQL)
```

## Stack

| Layer    | Choice                                                                 |
| -------- | ---------------------------------------------------------------------- |
| App      | Expo SDK 57, React Native 0.86, React 19, TypeScript 6, Expo Router    |
| Server   | Express 5, TypeScript 7, Zod 4, Prisma 7, PostgreSQL (`@prisma/adapter-pg`) |
| Auth     | JWT in `expo-secure-store`, bcrypt hashes                             |
| AI       | Any OpenAI-compatible chat-completions endpoint, with a no-key fallback |

## Setup

Windows (PowerShell):

```powershell
git clone <this repo>; cd safe-safar
npm install                      # root tooling (concurrently)
npm run setup                    # copies .env files, installs both packages, migrates + seeds
npm run dev                      # API on :4000 and the Expo dev server
```

macOS / Linux:

```bash
git clone <this repo> && cd safe-safar
npm install
npm run setup
npm run dev
```

`npm run setup` is a safe shorthand for the three steps a fresh clone needs, and it
never overwrites an existing `.env`:

```bash
npm run env:copy                 # .env.example -> .env in server/ and mobile/
npm run install:all              # npm install in server/ and mobile/
npm --prefix server run setup    # prisma generate + migrate + seed
```

`server/.env.example` ships a placeholder `DATABASE_URL`. Point it at a real PostgreSQL
database before migrating — a `file:` URL is rejected by the server config on purpose.
Any Postgres works; two easy local options:

```bash
# Option A: no installation needed, ephemeral local server (URL/port printed on start)
npx prisma dev --detach

# Option B: your own server
# DATABASE_URL="postgresql://user:password@localhost:5432/smarttrip?sslmode=disable"
```

`npm --prefix server run setup` then generates the client, applies
`server/prisma/migrations`, and seeds demo data. Skip the seed against any database you
care about: it creates `demo@smarttrip.app` with a published password.

Seed login: `demo@smarttrip.app` / `smarttrip123`

### Required: set a real JWT secret

`server/.env` ships with a placeholder. Replace it before starting the server:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Paste the output into `JWT_SECRET` in `server/.env`. The server runs in development
with the placeholder, but **refuses to boot in production** with a placeholder or with
fewer than 32 characters.

### Pointing the app at the API

`mobile/.env` holds `EXPO_PUBLIC_API_URL`:

| Target                | Value                                |
| --------------------- | ------------------------------------ |
| iOS simulator / web   | `http://localhost:4000/api/v1`       |
| Android emulator      | `http://10.0.2.2:4000/api/v1`        |
| Physical device       | `http://<your-LAN-IP>:4000/api/v1`  |

For a physical device, use the IPv4 address from `ipconfig` and keep the phone on the
same Wi-Fi. `localhost` on a phone points at the phone, not your machine.

## Scripts

From the repo root:

| Command             | Does                                              |
| ------------------- | ------------------------------------------------- |
| `npm run dev`       | API + Expo dev server together                   |
| `npm run dev:server`| API only, with reload                             |
| `npm run dev:mobile`| Expo dev server only                              |
| `npm run mobile:ios` / `mobile:android` / `mobile:web` | Open on a platform |
| `npm test`          | API integration tests (34 assertions)             |
| `npm run typecheck` | Typecheck both packages                           |
| `npm run lint`      | Lint both packages                                |
| `npm run build:server` | Build the API for production                   |
| `npm --prefix mobile run build:web` | Production web bundle into `mobile/dist` |
| `npm run doctor`    | `expo-doctor` health check on the app              |
| `npm run db:reset`  | Drop, re-migrate and re-seed. Local databases only |
| `npm run env:copy`  | Create missing `.env` files from their examples    |

## API

Base URL `/api/v1`. All routes except `/auth/register`, `/auth/login` and `/health`
require `Authorization: Bearer <token>`.

### Auth

| Method | Path              | Body                                    |
| ------ | ----------------- | --------------------------------------- |
| `POST` | `/auth/register`  | `name`, `email`, `password`, `phone?`   |
| `POST` | `/auth/login`     | `email`, `password`                     |
| `GET`  | `/auth/me`        | –                                       |

### Trips

| Method   | Path                 | Notes                                    |
| -------- | -------------------- | ---------------------------------------- |
| `GET`    | `/trips`             | Trips for the signed-in user, by start date |
| `POST`   | `/trips`             | `destination`, `startDate`, `endDate`, `travellers`, `budget?`, `currency?` |
| `GET`    | `/trips/:id`         | Trip with its full itinerary             |
| `POST`   | `/trips/:id/generate`| Generates and persists an AI itinerary   |
| `PATCH`  | `/trips/:id`         | `title?`, `status?`, `travellers?`, `budget?` |
| `DELETE` | `/trips/:id`         | –                                        |

`/trips/:id/generate` responds with `{ trip, source, safetyNotes }`. `source` is
`"ai"` when a provider key is configured, otherwise `"mock"` — the mock generator
returns a complete, realistic plan so the app is fully usable with no API key.

### Safety

| Method   | Path                          | Notes                                  |
| -------- | ----------------------------- | -------------------------------------- |
| `GET`    | `/safety/contacts`            | Emergency contacts, primary first      |
| `POST`   | `/safety/contacts`            | `name`, `phone`, `relation`, `isPrimary?` |
| `DELETE` | `/safety/contacts/:id`        | –                                      |
| `GET`    | `/safety/alerts`              | 50 most recent                         |
| `POST`   | `/safety/sos`                 | `latitude`, `longitude`, `tripId?`, `message?` |
| `POST`   | `/safety/check-ins`           | `latitude`, `longitude`, `note?`, `tripId?` |
| `GET`    | `/safety/check-ins`           | 50 most recent                         |
| `PATCH`  | `/safety/alerts/:id/acknowledge` | –                                   |

An SOS records a critical alert, writes a check-in, and notifies every emergency
contact. `server/src/services/safety.service.ts` is the delivery seam.

**No SMS provider is wired up yet.** Until one is, the response reports
`notified.simulated: true` with `delivered: 0` and `failed: <contact count>`, and the
app tells you to call your contact directly. It deliberately does not claim a message
was sent, because telling someone their contact was warned when it was not is worse
than an honest "not delivered". To finish it, send via Twilio or an India-compliant
provider (MSG91) in that function and set `simulated: false`.

## AI trip generation

`server/src/services/ai.service.ts` holds the prompt, the Zod output schema, and the
mock fallback. The model is asked for a plan that suits a solo female traveller:
well-lit and populated areas, verified accommodation, realistic per-person costs, and
concrete precautions rather than generic advice.

Configure any OpenAI-compatible provider in `server/.env`:

```
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

## Project layout

```
mobile/src/
├── app/                    Routes (Expo Router)
│   ├── _layout.tsx         Root stack + Stack.Protected auth gating
│   ├── index.tsx           Owns "/" and redirects to /trips or /login
│   ├── (tabs)/             trips · explore · safety · profile
│   ├── trip/new.tsx        Create a trip
│   ├── trip/[id].tsx       Trip detail + itinerary
│   ├── safety/sos.tsx      Emergency SOS
│   ├── safety/add-contact.tsx
│   ├── login.tsx, register.tsx
├── components/             Button, Card, SafetyBadge, TextField, ScreenHeader
├── hooks/                  useTrips, useSafety
├── lib/                    api client, auth context, mappers, config
├── theme/                  Design tokens — colours, spacing, radii, type
└── types/                  Domain types

server/src/
├── app.ts, index.ts        Express app and server bootstrap
├── db.ts, env.ts
├── generated/prisma/       Prisma client (generated, gitignored)
├── lib/                    jwt, validate, http-error
├── middleware/             auth, error handler
├── routes/                 auth, trips, safety
├── services/               ai.service, safety.service
└── prisma/schema.prisma
```

### Routing and auth

`app/index.tsx` is the only file allowed to own the `/` path. If a second index exists
at the root, or in a group that also resolves to `/`, Expo Router keeps one and the
other becomes unreachable — and a `<Redirect href="/(tabs)">` pointing at a group whose
index is `/` redirects to itself. `node mobile/scripts/route-audit.mjs` prints the route
table and flags duplicates; run it after adding a screen.

`(tabs)/index.tsx` is named `trips.tsx` for that reason. Auth is enforced with
`Stack.Protected` in the root layout, so deep-linking to `/trip/123` while signed out
lands on `/login` instead of rendering an empty screen.

### Design tokens

All visual values live in `mobile/src/theme/` — `colors.ts` and `metrics.ts`.
Rebranding or matching a new design means editing those two files rather than hunting
through screens.

### API shape

Prisma enums are uppercase on the wire (`SAFETY_LEVEL.RISK`). `mobile/src/lib/mappers.ts`
normalises the response into the app's lowercase domain types, so screens never deal
with the database's casing. Change the wire format in one place and nothing else moves.

## Development builds

`react-native-maps`, background location and `expo-notifications` contain native code
that Expo Go does not bundle. For those, create a development build:

```bash
npm --prefix mobile run android    # or ios, with Xcode
npx eas-cli build --profile development --platform android
```

Location (foreground), the API client, auth, the tab UI and trip planning all work in
Expo Go today.

## Deployment

Three pieces, all configured in their own dashboards. Nothing here is committed: real
values live in provider environment variables only.

| Piece            | Where                    | Notes                                                        |
| ---------------- | ------------------------ | ------------------------------------------------------------ |
| Database         | Neon PostgreSQL          | Fresh production database. `DATABASE_URL` is its pooled URL |
| API              | Render Web Service       | Node, Express, Prisma migrations on release                 |
| Web app          | Render Static Site       | Expo web export served from `mobile/dist`                   |

**API (Render Web Service)**

| Setting      | Value                                                     |
| ------------ | --------------------------------------------------------- |
| Root         | `server`                                                   |
| Build        | `npm install && npm run build`                             |
| Start        | `npm start`                                                 |
| Release      | `npm run prisma:migrate:deploy`                            |
| Health check | `/api/v1/health`                                           |

Environment variables (set them in the dashboard, never in the repo):

```
NODE_ENV=production
DATABASE_URL=<Neon pooled connection string>
JWT_SECRET=<48+ random characters>
JWT_EXPIRES_IN=7d
CORS_ORIGIN=<the static site's origin>
OPENAI_API_KEY=<optional; blank uses the built-in mock generator>
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

`PORT` is injected by Render. `TWILIO_*` are optional and only needed if an SMS provider
is wired into `safety.service.ts`.

**Web app (Render Static Site)**

| Setting    | Value                                                          |
| ---------- | -------------------------------------------------------------- |
| Root       | `mobile`                                                        |
| Build      | `npm install && npm run build:web`                              |
| Publish    | `dist`                                                          |
| Env        | `EXPO_PUBLIC_API_URL=<the API's https origin + /api/v1>`        |

`build:web` writes `dist/_redirects` so deep links such as `/trip/123` fall back to
`index.html` instead of 404ing, and it fails the build if the API URL was not inlined
correctly. Set `CORS_ORIGIN` on the API to the static site's origin so the two can talk.

Migrations run only from the Render release command, never from the build, so a failed
deploy cannot leave a half-migrated database.

## Security notes

- `.env` is gitignored; only `.env.example` is committed.
- `JWT_SECRET` must be at least 16 characters and the server refuses to boot without it.
  In production it must be a real secret of 32+ characters: the value copied from
  `.env.example` is explicitly rejected, so a leaked or placeholder key cannot sign tokens.
- Passwords are bcrypt-hashed at cost 12 and never returned by any endpoint.
- Trip and safety lookups are scoped by `userId`, so one user cannot read another's data
  (covered by tests).
- `helmet` and a configurable CORS origin are enabled; in production set `CORS_ORIGIN`
  to your app's origin instead of the default.
