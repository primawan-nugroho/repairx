# RepairX

Aviation MRO part-repair monitoring dashboard. See [CLAUDE.md](CLAUDE.md) for the full
product/tech spec and [DESIGN.md](DESIGN.md) for the visual design system.

## Getting started

1. Copy env template and fill in real values:
   ```bash
   cp .env.example .env.local
   ```
   - `DATABASE_URL`: a Neon Postgres connection string (create a free project at
     https://neon.tech).
   - `AUTH_SECRET`: generate with `openssl rand -base64 32`.

2. Install dependencies:
   ```bash
   npm install
   ```

3. Push the schema to your database:
   ```bash
   npm run db:push
   ```

4. Create your first admin account (local username/password login):
   ```bash
   npm run create-user -- admin "ChangeMe123!" "Admin User" admin
   ```

5. (Optional) One-time import of the existing Excel workbooks
   (`Main Database.xlsx`, `End Shift Report.xlsx` in the repo root):
   ```bash
   npm run import:excel
   ```

6. Run the dev server:
   ```bash
   npm run dev
   ```
   Visit http://localhost:3000 and sign in with the account created in step 4.

## Deployment

Deploy to Vercel (free Hobby tier) connected to this repo; set `DATABASE_URL` and
`AUTH_SECRET` as Vercel environment variables. Neon's free tier autosuspends when idle
— the first request after a quiet period has a ~1s cold start, which is fine for a
~30-user internal tool.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` / `npm run start` | Production build/serve |
| `npm run db:push` | Push Drizzle schema to the database |
| `npm run db:studio` | Browse the database with Drizzle Studio |
| `npm run create-user -- <username> <password> "<Display Name>" <role>` | Create/update a local account. Role is `admin`, `production_control`, or `viewer`. |
| `npm run import:excel` | One-time import of the two source workbooks |
