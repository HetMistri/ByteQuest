# ByteQuest

ByteQuest is a competitive puzzle-solving platform where participants join events, solve ordered problems, and climb a time-based leaderboard.

## Stack

- Frontend: React + TypeScript + Vite
- Backend: NestJS + Prisma
- Database: SQLite (Prisma)
- Auth: Supabase JWT (verified on backend)

## Implemented Phases

- Phase 1: Event lifecycle APIs (`scheduled`, `running`, `paused`, `ended`)
- Phase 2: Participant join flow with password and kick support
- Phase 3: Ordered problem system with progression lock
- Phase 4: Submissions with correctness validation and unlock logic
- Phase 5: Time-based scoring on first correct solve
- Phase 6: Deterministic leaderboard API with solved progress metadata

## Local Development

### 1) Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 2) Configure environment variables

Server:

```bash
cp server/.env.example server/.env
```

Client:

```bash
cp client/.env.example client/.env
```

### 3) Run app in development

```bash
./run-app-dev.sh --skip-install
```

## Production Deployment

### Frontend on Vercel

1. Create a new Vercel project from this repo.
2. Set Root Directory to `client`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Add environment variables:
	- `VITE_API_URL` (Render backend URL)
	- `VITE_SUPABASE_URL`
	- `VITE_SUPABASE_ANON_KEY`
	- `VITE_SUPABASE_PROBLEM_BUCKET`
6. `client/vercel.json` is included to support SPA route rewrites.

### Backend on Render

1. Create a Render Web Service from this repo.
2. Set Root Directory to `server`.
3. Build command:

```bash
npm install && npx prisma generate && npm run build
```

4. Start command:

```bash
npm run start:render
```

5. Add environment variables:
	- `NODE_ENV=production`
	- `PORT=10000`
	- `CORS_ORIGIN=https://<your-vercel-domain>`
	- `SUPABASE_URL`
	- `SUPABASE_ANON_KEY`
	- `SUPABASE_SERVICE_KEY`

6. Provision persistent disk mounted at:

```text
/opt/render/project/src/server/data
```

`render.yaml` is included as the deployment blueprint.

## API Endpoints (Core)

- `GET /events`
- `GET /events/:id`
- `POST /events/:id/join`
- `GET /events/:id/participants`
- `GET /events/:id/leaderboard`
- `POST /events/:id/submit`
- `GET /events/:id/results/me`

Swagger docs:

- `/api/docs`
