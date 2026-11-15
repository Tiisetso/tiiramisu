# Tiiramisu

**Every small step makes the light bloom, and the room is never cold when you come back. Gentle care that rewards, not nags.**

A warm companion for the weeks after TMS depression treatment. Built solo for Junction 2026, "Beyond the Clinic" (Aalto University).

**[Try it](https://tiiramisu.vercel.app/?day=58&demo=1)** · **[Watch the 2-minute film](https://youtu.be/Ias1-FVwZC8)**

## Why

When the daily clinic visits end, relapse rarely announces itself. Sleep drifts, days and nights blur, a voice grows quieter, and nobody is there to notice. Tiiramisu notices gently, offers one small step sized for the day, and learns what helps each person.

## What it does

- **Sense.** A 30-second voice check-in: speaking rate, pauses, pitch variability and loudness are measured on the phone and compared with *your own* usual voice. Sleep, day/night rhythm, movement, HRV and mood are each read against your last four weeks.
- **Respond.** One step sized for today: a 10-minute walk on a steady day, "just step outside, 2 minutes" on a harder one. A breathing orb, a soundscape and a light field that follow your mood. Crisis help is one tap away on every screen.
- **Reinforce.** Every small act makes the light bloom with a soft chime, and the day keeps a warm afterglow. "Predict, then notice" shows when something felt better than expected. No streaks, points or badges.
- **Learn.** "Did it help?" builds a personal picture of what works for you.
- **Connect.** Friends see only a soft "checked in today"; waves and small wins are one tap. An anonymous room for people who've had TMS.
- **Clinic.** Clinicians see who has drifted from their own baseline, read a Claude summary, and can reach out gently in one tap.
- **Gentle by design.** Notifications never show a number or pile up, and nothing private appears on the lock screen. Dark and light mode follow your phone. Installs from Safari: Share → Add to Home Screen.

Built with Next.js, Claude, ElevenLabs (speech-to-text, ambience), Aiven for PostgreSQL (EU) and Vercel. Voice recordings are never stored.

- Product, goals and working rules: [AGENTS.md](AGENTS.md)
- Design system: [DESIGN.md](DESIGN.md)
- Evidence & references: [docs/references.md](docs/references.md)

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
