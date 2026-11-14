<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Context and working rules for any coding agent (Claude Code, Codex, …) on this repo. Keep it current: update **Status** and **Decisions** as work lands.

## The challenge

Junction 2026, **"Beyond the Clinic"** by Aalto University. Build a product that helps people **stay well at home after TMS depression treatment**, where relapse risk is high once daily clinic visits end. Ideally a closed loop: **sense** how someone is doing → **respond** with something that helps → **learn** what works for that person.

**Judging (25% each):** Usefulness · Ease of use (would someone recovering from depression use it daily?) · Smart sensing (clever use of what can be measured at home, personalised) · Creativity.

**Deadlines:** build freeze **23:00, 14 Nov 2026**; demo the next morning. Solo builder (Tiisetso) + agents. The emphasis is on the **demo**; go deep on a few real features, mock the rest convincingly.

## The product: Tiiramisu (working name)

A warm, comforting web app companion:

1. **Voice check-in** (30 s daily): acoustic features computed on device (speech rate, pauses, pitch variability, loudness) + ElevenLabs Speech-to-Text → Claude for themes/tone.
2. **Signals vs personal baseline**: sleep regularity, day/night activity rhythm, HRV/resting HR, mood. Always relative to *your* usual.
3. **Respond**: adaptive generative soundscape + lava-lamp "light field" that follow mood; small suggestions (walk, breathe, message a friend).
4. **Learn**: "did it help?" → per-person weights → "what helps you".
5. **Circle**: real friends + anonymous TMS peers, low-effort contact (waves, preset messages), crisis help one tap away.
6. **Clinician view**: who drifted this week and might need a call.

Health data in production would come from an **Apple Shortcut** that POSTs HealthKit samples to `/api/ingest` (web apps can't read HealthKit). **The demo runs on a seeded persona ("Aino", 60 days, drifting toward relapse at the end) with a hidden time slider**, so it works anywhere with no account.

### Evidence we lean on
- Flattened day/night rest-activity rhythm preceded relapse (JAMA Psychiatry, recovered MDD, n=93).
- Less efficient sleep + irregular sleep midpoint → worse outcomes (RADAR-MDD).
- Within-person drops in speaking rate, articulation rate, loudness and pitch variability track worse days (Interspeech 2025, n=71 daily; n=585 cohort).
- WARN-D: Oura ring after rTMS to detect early relapse (JMIR protocol, 2026).
- GPS mobility correlates but doesn't predict; mention only, don't build.

## Stack

Next.js (App Router, TypeScript) · Tailwind · Framer Motion · WebGL shader (light field) · Tone.js (soundscape) · Meyda/Web Audio (voice features) · ElevenLabs (STT, TTS, sound/music, video voiceover) · Anthropic SDK, `claude-opus-5-5` · `BroadcastChannel` for demo chat (Supabase only if time) · Vercel (auto-deploys `main`, previews on PRs) · Playwright for the demo video.

Secrets: `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`. Set in Vercel and `.env.local`. **Never** expose to the client; all third-party calls go through `/api/*` routes.

## Working rules

- **Design:** follow [DESIGN.md](DESIGN.md) (tokens, light field, motion, copy rules). Patient-facing copy never says *risk, relapse, score, warning, failed, missed, streak*.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `style:`, `test:`), with scope where useful (`feat(voice): …`).
- **Branches + PRs:** one branch per issue (`feat/…`, `docs/…`, `fix/…`). Open a PR for Tiisetso to review and merge; never push to `main`. PR descriptions are **very short**: 2–4 bullets + `Closes #N`.
- **Priorities:** work in tier order (tier-1 → tier-4 labels). If behind schedule, cut from the bottom.
- **Demo-safety:** every live feature has a fallback (sample recording, cached analysis, simulated peers).
- **Mobile-first:** test at 390px; the demo may run on a phone.
- Private files `partner-report.md` and the brief PDF are gitignored (they contain event promo codes; the repo is public).

## Status

| # | Tier | Issue | Status |
|---|---|---|---|
| 1 | 1 | Scaffold Next.js + Vercel | in review |
| 2 | 1 | Design system + light field | in review |
| 3 | 1 | Demo persona + time slider | in review |
| 4 | 1 | Voice check-in (on-device features) | in review |
| 5 | 1 | `/api/analyze` (ElevenLabs STT → Claude) | in review |
| 6 | 1 | Today screen | in review |
| 7 | 2 | Adaptive soundscape | in review |
| 8 | 2 | Response loop + learning | in review |
| 9 | 3 | Circle: friends + anonymous peers | done |
| 10 | 3 | Apple Shortcut ingest | todo |
| 11 | 4 | Clinician view | in review |
| 12 | 4 | Demo video | todo |
| 13 | 4 | Pitch + submission | todo |

## Decisions log

- **Web app, not native.** A Capacitor shell was considered for HealthKit, but the demo matters more; the Shortcut covers real data.
- **No Gemini** (access not granted) → ElevenLabs STT + Claude for content analysis.
- **Partner prizes:** ElevenLabs (STT + TTS + sound + voiceover). Codex optional.
- **No Supabase/auth for the demo**: seeded persona + `BroadcastChannel` chat.
- **Design** adapted from an Oura DESIGN.md analysis into our own system (Fraunces + Inter, dusk-blue action, care terracotta, night palette).
- **Demo arc (Aino, `src/lib/demo/persona.ts`):** steady → wobble "watch" days 32–35 (recovers) → steady → "watch" day 53 → "drifting" 54–59. Self-reported mood barely drops while passive signals do (pitch point: the app notices first). URL: `?demo=1&day=44`.
- **Signals (`src/lib/signals.ts`):** 7 signals vs a 28-day personal baseline (excluding the last 7 days); z-scores with SD floors, capped at 4; weighted drift score → steady / watch / drifting.
- **`/api/analyze`:** ElevenLabs Scribe (v2, falls back to v1, audio-event tags) → `claude-opus-5-5` structured output (Zod, effort `low`, server-side refusal fallbacks). ~4–6 s. Never fails the demo: canned per-drift-level response with `source: "fallback"`. `risk_flag: "reach_out"` must open the crisis sheet.
- **Voice check-in:** features computed on device (`src/lib/voice/`): RMS + autocorrelation pitch per frame → speaking rate, pause ratio, pitch variability, loudness. The **first check-in on a device becomes "your usual voice"** (localStorage); later ones are compared to it. Demo: reset the baseline in the ◐ drawer, record normally on day 44, then tired on day 58. Sample buttons (`?demo=1`) send canned transcripts; no real sample audio yet.
- **Crisis sheet:** 112, MIELI Crisis Helpline 09 2525 0111 (Finnish, 24/7), MIELI English chat (English phone line closed 2026). Verify before the demo.
- **Soundscape (`src/lib/sound/engine.ts`):** Tone.js pads + sparse bells per mood (chords, tempo, filter) over ElevenLabs Sound Effects loops in `public/audio/` (generated once by `scripts/generate-ambience.mts`, levelled in code). calm → forest, low → rain, bright → sea, night → night. Starts on the Begin tap; ducks to silence while the mic records.
- **Learning (`src/lib/learning.ts`):** per-person Beta posterior of "did that help?" per intervention + relevance bonus (biggest for the most-shifted signal) + small bonus for Claude's suggestion. Aino has ~20 seeded outcomes; ◐ drawer → "Fresh user" shows the same day ranked for someone the app doesn't know yet.
- **Circle (`src/lib/chat.ts`, `chat-provider.tsx`):** live chat between windows via `BroadcastChannel` (no backend). Open `/?as=maya` in a second window to be Maya's phone; she sees only Aino's soft status. Scripted replies only when the real person isn't open. Peer room is anonymous (Aino = "Cloudberry"), has Report, and a crisis-phrase check opens the crisis sheet.
- **Clinic (`/clinic?day=N`):** Aino + 5 simulated patients (`src/lib/demo/patients.ts`, same generator + signals pipeline), sorted by drift; "No check-ins" flag (Jonas). Selecting a patient asks `/api/clinic-summary` (Claude, cached in memory, canned fallback) for a summary, watch points and suggested action. Link from the ◐ drawer.
- **Live mode (Aiven for PostgreSQL, Frankfurt EU):** `DATABASE_URL` (server-only) + CA cert (`certs/aiven-ca.pem`, embedded in `src/lib/server/aiven-ca.ts`, TLS verified). Free plan → no PgBouncer; small per-instance pool (max 3, 10 s idle). Tables auto-created (`SCHEMA` in `src/lib/server/db.ts`; `scripts/migrate.mjs`). Chat syncs across devices + presence; check-ins (features/transcript/analysis, **never audio**) appear in `/clinic` in ~3 s; outcomes persist; "contacted" shared. Without `DATABASE_URL` everything runs locally. **Before the demo:** `node --env-file=.env.local scripts/reset-live.mjs`.
- **CI on CRACI (`.github/workflows/ci.yml`):** all jobs `runs-on: craci`, deny-by-default network (validated against CRACI's JSON schema). `build` (lint+build), `synthetic-patient` (Playwright: recorded voice as fake mic, drift → insight → response → learning, crisis + `reach_out` + banned-words safety checks, videos as artifacts), `privacy-guard` (after both finish: CRACI API SBOM + network trace per job → fail on tracker packages or undeclared hosts; data-flow attestation; publishes to Aiven `build_attestations` → clinic badge via `/api/build-trust`). Secrets: `CRACI_API_TOKEN`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY`, `DATABASE_URL`. Local: `DATABASE_URL= npx playwright test`.
- **Onboarding & consent (`src/lib/consent.ts`):** first run after Begin → 3 screens (what it notices · what stays yours · your circle). Consent is honoured everywhere: voice off → typed check-in; clinic sharing off → no `/api/checkins`; circle/peers choices shape Circle. "Privacy & what's shared" on Today reopens the switches; ◐ drawer → "Replay onboarding". e2e helper `begin()` marks onboarding done; `e2e/onboarding.spec.ts` checks consent is respected.
- **Outreach + push (#38):** clinic "Reach out gently" → `/api/outreach` (Aiven `clinic_actions`) → patient's Today card (polls 4 s) with time slots → answer shows in clinic. Web push via `web-push` + VAPID (`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`), subscriptions in `push_subscriptions`, `public/sw.js`. Rules in DESIGN.md → Notifications: no badge numbers, one per kind (tag), no content on lock screen, quiet hours. iPhone: must be added to Home Screen (iOS 16.4+), then turn on "Gentle reminders" in Privacy.
- **Reinforcement (`src/lib/field-events.ts`):** `bloom(size, at)` / `soften()` drive a ripple + daily afterglow in the light-field shader. Wired to check-ins, mood taps, activities, "did it help?", waves/messages, breaths, outreach answers, onboarding. See DESIGN.md → Motion → Reinforcement.
- **Testing hygiene:** run local test servers with `DATABASE_URL=` (blank) so tests never write to Aiven; otherwise `scripts/reset-live.mjs` clears the last 24 h, including real phone data.
