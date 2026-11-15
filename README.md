# Tiiramisu

A warm companion that helps people stay well at home after TMS depression treatment. Built for Junction 2026, "Beyond the Clinic" (Aalto University).

- Product, goals and working rules: [AGENTS.md](AGENTS.md)
- Design system: [DESIGN.md](DESIGN.md)
- Evidence & references (for the submission): [docs/references.md](docs/references.md)

## Demo URLs

| What | URL |
|---|---|
| Patient app (Aino, today) | `/` |
| With presenter controls (◐) | `/?demo=1` |
| A specific day | `/?demo=1&day=44` (steady) · `&day=58` (drifting) |
| Another patient | `/?patient=elias&demo=1` (also `sara`, `helmi`, `mikko`, `jonas`) |
| Maya's phone (friend) | `/?as=maya&day=58`, open next to the patient app for live chat |
| Clinician view | `/clinic?day=58` |

The ◐ drawer links to all of these.

## Live mode (shared database)

Set `DATABASE_URL` (Aiven for PostgreSQL) to sync chat across devices and stream check-ins to `/clinic`. Without it the app runs fully locally.

- Create tables: `node --env-file=.env.local scripts/migrate.mjs` (also automatic on first request)
- Clear demo data before presenting: `node --env-file=.env.local scripts/reset-live.mjs` (`--all` for everything)
