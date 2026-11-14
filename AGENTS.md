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
| 3 | 1 | Demo persona + time slider | todo |
| 4 | 1 | Voice check-in (on-device features) | todo |
| 5 | 1 | `/api/analyze` (ElevenLabs STT → Claude) | todo |
| 6 | 1 | Today screen | todo |
| 7 | 2 | Adaptive soundscape | todo |
| 8 | 2 | Response loop + learning | todo |
| 9 | 3 | Circle: friends + anonymous peers | todo |
| 10 | 3 | Apple Shortcut ingest | todo |
| 11 | 4 | Clinician view | todo |
| 12 | 4 | Demo video | todo |
| 13 | 4 | Pitch + submission | todo |

## Decisions log

- **Web app, not native.** A Capacitor shell was considered for HealthKit, but the demo matters more; the Shortcut covers real data.
- **No Gemini** (access not granted) → ElevenLabs STT + Claude for content analysis.
- **Partner prizes:** ElevenLabs (STT + TTS + sound + voiceover). Codex optional.
- **No Supabase/auth for the demo**: seeded persona + `BroadcastChannel` chat.
- **Design** adapted from an Oura DESIGN.md analysis into our own system (Fraunces + Inter, dusk-blue action, care terracotta, night palette).
