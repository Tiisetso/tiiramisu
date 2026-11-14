---
version: 1.0
name: Tiiramisu
description: A warm-paper companion for staying well after depression treatment. Cream and earth tones, a thin expressive serif for feeling and a calm sans for facts, a slow lava-lamp light field that breathes with the user's day, and one gentle action colour per screen. Inspired by the editorial calm of premium wellness brands; original to this product.

colors:
  # ── Day world (light, default) ──
  primary: "#3b5f9e"        # dusk blue: the one action per screen (6.3:1 with white)
  on-primary: "#ffffff"
  stone: "#4a4741"          # workhorse warm neutral: secondary pills, links, icons
  on-stone: "#ffffff"
  canvas: "#f7f1e8"         # warm paper: the default background
  surface: "#ffffff"        # elevated cards, inputs
  surface-warm: "#fbf7f1"   # quiet card on canvas
  hairline: "#e1dcd3"
  ink: "#1c1b1a"            # primary text (15.3:1 on canvas)
  ash: "#6e6b66"            # secondary text (4.7:1 on canvas, AA)
  mute: "#a8a5a0"           # DECORATIVE ONLY (2.2:1): dividers, disabled glyphs, never text

  # Earth accents: light field, bands, illustration, data-viz. Never buttons.
  clay: "#6b443d"
  espresso: "#39221e"
  gold: "#af751b"           # 3.5:1 on canvas: large text / graphics only
  ochre: "#bc924c"
  gold-soft: "#ddaa61"
  gold-pale: "#ddbe78"
  gold-deep: "#684d07"      # gold as text (7:1)
  forest: "#224228"
  olive: "#5c6f5d"          # sage as text (4.8:1)
  sage: "#849671"
  sage-pale: "#ced4b8"
  blush: "#e8c4b0"          # warm light-field highlight
  dusk-pale: "#c9d4ea"      # cool light-field highlight

  # Care: crisis + clinician "needs a call". Warm terracotta, never alarm red.
  care: "#b4532f"           # 5:1 with white
  on-care: "#ffffff"

  # ── Night world (dark mode, evenings) ──
  night-canvas: "#17120f"
  night-surface: "#231c18"
  night-hairline: "#3a312b"
  night-ink: "#f3ece2"      # 15.9:1
  night-ash: "#a89f94"      # 7.1:1
  night-primary: "#8fb0e8"  # used with night-canvas text (8.5:1)
  night-gold: "#ddaa61"
  night-sage: "#a7b893"

typography:
  # Fraunces (serif, variable: opsz + wght) and Inter (sans), both Google Fonts via next/font.
  # Sizes are mobile-first; desktop values in brackets apply ≥ 1024px.
  display:
    fontFamily: Fraunces
    fontSize: 48px          # [80px]
    fontWeight: 300
    lineHeight: 1.08
    letterSpacing: -0.5px
  heading-1:
    fontFamily: Fraunces
    fontSize: 36px          # [56px]
    fontWeight: 300
    lineHeight: 1.12
    letterSpacing: -0.25px
  heading-2:
    fontFamily: Fraunces
    fontSize: 28px          # [40px]
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: 0
  lead:
    fontFamily: Fraunces
    fontSize: 22px          # [24px]
    fontWeight: 300
    lineHeight: 1.35
    letterSpacing: 0
  title:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: -0.1px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: 0
  button:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0
  ui:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  caption:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0
  eyebrow:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: 1.2px    # uppercase
  stat:
    fontFamily: Fraunces
    fontSize: 40px
    fontWeight: 300
    lineHeight: 1
    letterSpacing: 0

rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 24px
  xl: 40px
  full: 9999px

spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 72px
  gutter: 20px              # mobile side gutter

motion:
  ease-soft: "cubic-bezier(0.22, 1, 0.36, 1)"   # gentle ease-out, default
  ease-breathe: "cubic-bezier(0.45, 0, 0.55, 1)" # symmetric, for loops
  duration-fast: 200ms      # press feedback
  duration-base: 500ms      # enter / exit
  duration-slow: 900ms      # screen transitions, reveals
  breath-cycle: 10s         # 4s in · 6s out, used by orb + breathing guide
  field-cycle: 40s          # one slow drift of the light field (calm state)

components:
  light-field:
    description: "Full-screen animated lava-lamp background. WebGL fragment shader; CSS blur-blob fallback."
    palette: "{mood palettes, see Motion}"
    zIndex: -1
  orb:
    description: "Breathing voice orb on the check-in screen. Reacts to mic level."
    size: 220px
    rounded: "{rounded.full}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    height: 56px
  button-secondary:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.on-stone}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    height: 52px
  button-ghost:
    backgroundColor: transparent
    textColor: "{colors.stone}"
    borderColor: "{colors.stone}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
  button-icon:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.stone}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.full}"
    size: 48px
  button-care:
    backgroundColor: "{colors.care}"
    textColor: "{colors.on-care}"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
  glass-card:
    description: "Default card floating over the light field."
    backgroundColor: "rgba(255,255,255,0.62)"   # night: rgba(35,28,24,0.62)
    backdropFilter: "blur(24px) saturate(1.1)"
    borderColor: "rgba(255,255,255,0.7)"        # night: night-hairline
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  insight-card:
    description: "The 'I noticed…' card. Fraunces lead + sans body + one action."
    backgroundColor: "{components.glass-card.backgroundColor}"
    accentBar: "{colors.gold-soft}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  signal-row:
    description: "One signal vs personal baseline: label, soft sparkline, plain-language delta."
    typography: "{typography.body}"
    sparkline: "{colors.olive}"
    baselineBand: "{colors.sage-pale}"
    padding: "{spacing.md} 0"
  mood-scale:
    description: "1–5 one-tap mood picker: five soft circles tinted from clay to gold."
    rounded: "{rounded.full}"
    size: 52px
  chip:
    backgroundColor: "{colors.surface-warm}"
    textColor: "{colors.stone}"
    borderColor: "{colors.hairline}"
    typography: "{typography.ui}"
    rounded: "{rounded.full}"
  wave-button:
    description: "Low-effort social action (wave / preset message). Large, friendly, one tap."
    backgroundColor: "{colors.gold-pale}"
    textColor: "{colors.espresso}"
    rounded: "{rounded.full}"
    size: 64px
  chat-bubble-self:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "20px 20px 6px 20px"
  chat-bubble-other:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "20px 20px 20px 6px"
  avatar:
    description: "Friends: initials on a gold/sage/clay disc. Anonymous peers: abstract blob glyph, never a photo."
    rounded: "{rounded.full}"
    size: 44px
  tab-bar:
    description: "Bottom nav on mobile: Today · Check in · Circle · Calm. Glass surface, safe-area aware."
    backgroundColor: "{components.glass-card.backgroundColor}"
    activeColor: "{colors.ink}"
    inactiveColor: "{colors.ash}"
    typography: "{typography.caption}"
  text-input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline}"
    focusRing: "{colors.primary}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
  clinician-table:
    description: "Clinician view only: denser data table on plain canvas, no light field."
    headerTypography: "{typography.eyebrow}"
    bodyTypography: "{typography.body}"
    rowBorder: "{colors.hairline}"
    flag: "{colors.care}"
  demo-controls:
    description: "Hidden presenter drawer (time slider, persona day, reset). Stone on surface, opened by a long-press or ?demo=1."
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"

---

## Overview

Tiiramisu is a daily companion for people who have finished TMS treatment for depression and want to stay well at home. The user may be tired, low or anxious when they open it, so **every screen should feel like a warm room, not a dashboard.**

The visual language borrows the calm of editorial wellness design: warm paper instead of white, an earthy palette of mustard, clay and sage, a thin high-contrast serif for moments of feeling and a quiet sans for everything you read. On top of that sits the signature element: **the light field**, a slow lava-lamp background of soft, merging colour that breathes with the user's day. It slows and warms on a hard day and brightens gently as things improve, in step with the soundscape. The background is part of the intervention, not decoration.

**Key characteristics**
- Warm-paper canvas (`{colors.canvas}`) by day; warm espresso night (`{colors.night-canvas}`) in the evening and in dark mode.
- The **light field** behind everything on patient screens; content floats over it on frosted glass cards.
- Serif for feeling (`{typography.display}`, `{typography.lead}`), sans for facts (`{typography.body}`).
- **One action per screen** in dusk blue (`{colors.primary}`). Everything else is stone, ghost or chip.
- Earth accents (gold, clay, sage) colour the light field, data and illustration, never buttons.
- Large touch targets, almost no typing, and short sentences, because the user may have very little energy.
- Data is always shown **relative to the person's own normal**, never as a score or grade.

## Colors

### Action
- **Dusk Blue** (`{colors.primary}`, #3b5f9e): the single primary action on a screen ("Start check-in", "Play", "Send wave"). Calm and trustworthy, distinct from the warm field. Not used for links, icons or decoration.
- **Stone** (`{colors.stone}`, #4a4741): secondary buttons, links, icons, outlines.
- **Care** (`{colors.care}`, #b4532f): reserved for the "Talk to someone now" crisis button and the clinician "needs a call" flag. Warm terracotta, never alarm red, and never used for the user's own data.

### Surfaces
- **Canvas** (`{colors.canvas}`, #f7f1e8) is the resting state. **Surface** (#fff) is for inputs and elevated cards. **Surface Warm** (#fbf7f1) is for quiet chips and cards.
- **Glass cards** (`{components.glass-card}`) sit over the light field: 62% white with a 24px backdrop blur. Over a light field, text contrast must still pass AA. Check the darkest field state.

### Text
- **Ink** (#1c1b1a) primary · **Ash** (#6e6b66) secondary, AA on canvas · **Mute** (#a8a5a0) is decorative only and never used for text.
- Gold as text uses **Gold Deep** (#684d07); sage as text uses **Olive** (#5c6f5d).

### Earth accents
- **Gold ramp** (gold-deep → gold → ochre → gold-soft → gold-pale): warmth, energy, "brighter" days.
- **Clay ramp** (espresso → clay → blush): grounding, comfort, low days.
- **Sage ramp** (forest → olive → sage → sage-pale): calm, nature, sleep, baselines.
- **Dusk pale** (#c9d4ea): a cool highlight for calm and night fields.

### Night world
Evening check-ins and dark mode use `{colors.night-canvas}` (#17120f), a warm near-black, never pure black. Text is `{colors.night-ink}` / `{colors.night-ash}`. The primary action becomes `{colors.night-primary}` with dark text. The light field shifts to deep clay, espresso and dusk.

## Typography

**Fraunces** (Google Fonts, variable): thin weights (300), high optical size, for display, headings, leads and big numbers. It's where the warmth and personality live. Use italic sparingly for one emphasised word ("you slept a little *later* this week").

**Inter** (Google Fonts): everything you read or tap: body, buttons, labels, captions.

| Token | Family | Mobile | Desktop | Weight | Use |
|---|---|---|---|---|---|
| `display` | Fraunces | 48 | 80 | 300 | Begin screen, greeting ("Good morning, Aino") |
| `heading-1` | Fraunces | 36 | 56 | 300 | Screen titles |
| `heading-2` | Fraunces | 28 | 40 | 300 | Section titles, insight headlines |
| `lead` | Fraunces | 22 | 24 | 300 | Gentle reflections, check-in prompt |
| `stat` | Fraunces | 40 | 40 | 300 | Single numbers ("7h 10m") |
| `title` | Inter | 20 | 20 | 500 | Card titles |
| `body-lg` | Inter | 18 | 18 | 400 | Important reading |
| `body` | Inter | 16 | 16 | 400 | Default |
| `button` | Inter | 16 | 16 | 600 | Buttons |
| `ui` | Inter | 14 | 14 | 500 | Tabs, chips |
| `caption` | Inter | 13 | 13 | 400 | Meta |
| `eyebrow` | Inter | 12 | 12 | 600 caps | Section overlines ("THIS WEEK") |

Principles: scale, not boldness, creates hierarchy. Never set body copy in Fraunces. Keep line lengths around 60 characters.

## Layout

- **Mobile-first.** Design for 390px wide, then enhance. 20px side gutter, single column, content max-width 560px centred on larger screens.
- **Base unit 8px.** Card padding `{spacing.lg}`; space between cards `{spacing.md}`; space between sections `{spacing.2xl}`–`{spacing.3xl}`.
- **One idea per screen.** A screen answers one question ("How are you?", "What I noticed", "Something that might help"). Progressive disclosure for detail.
- **Bottom tab bar** on mobile (Today · Check in · Circle · Calm); top bar with the same items ≥ 1024px.
- **Thumb zone:** the primary action sits in the bottom third of the screen.
- Respect safe-area insets on iOS.
- The clinician view is a desktop layout: left list, right detail, plain canvas, no light field.

## Motion

Motion should feel like breathing: slow, continuous, never sudden.

### The light field (signature)
- A full-screen **WebGL fragment shader**: 4–6 soft colour fields (metaball / domain-warped noise) that drift, merge and split like a lava lamp. Heavy softness, no hard edges, subtle film grain (2–3%) to avoid banding.
- Inputs (uniforms): `palette[4]`, `speed`, `softness`, `brightness`. All transitions between states cross-fade over **3–4 s**, so it never snaps.
- **Mood palettes**

| State | When | Palette | Speed |
|---|---|---|---|
| `calm` | Default, stable days | canvas, sage-pale, gold-pale, dusk-pale | 1.0× (40 s cycle) |
| `low` | Low mood / drift detected | blush, clay (20% opacity), gold-soft, canvas | 0.6×, warmer, softer |
| `bright` | Improving / after an activity that helped | gold-pale, gold-soft, sage-pale, canvas | 1.2×, slightly brighter |
| `listening` | During voice check-in | dusk-pale, sage-pale, blush | follows mic level (±15%) |
| `night` | Evening / dark mode | night-canvas, espresso, clay, dusk (low alpha) | 0.5× |

- **Fallback:** under `prefers-reduced-motion`, without WebGL, or on low battery, use 4 blurred CSS radial-gradient blobs (filter: blur(80px)) drifting via slow transforms. Reduced motion means a static gradient with only colour cross-fades.
- Pause rendering when the tab is hidden. Cap at 30 fps on mobile, and render at half resolution, since the blur hides it.

### UI motion
- Enter: fade + 12px rise, `{motion.duration-base}`, `{motion.ease-soft}`. Stagger lists by 60ms.
- Screen transitions: cross-fade, `{motion.duration-slow}`. No sideways slides or bounces.
- Press: scale 0.97, `{motion.duration-fast}`.
- **Orb:** breathes on `{motion.breath-cycle}` (4 s in, 6 s out) when idle; during recording its scale and glow follow the mic level, smoothed.
- No springs with overshoot, no shaking, no flashing, no confetti. Celebrations are a warm brightening of the field.

## Sound

The soundscape and the light field share one `mood` state, so they always agree. Audio starts only after the Begin tap. A volume/mute control is always reachable. Fades are ≥ 2 s, and there are no sudden sounds or notification pings inside the app.

## Notifications

Notifications reach people who may already feel overwhelmed, so they are rare and quiet.

- **Never a number.** No app-icon badge counts, ever; any badge is cleared when the app opens.
- **Never a pile.** One notification per kind (`tag` replaces the previous one, no re-alert), so there is only ever one waiting.
- **Never guilt.** No "you missed…", no streaks, no urgency language. Lock-screen text never shows message content or health information ("Maya sent you a message", not what she wrote).
- **Quiet hours.** 22:00–08:00 hold anything non-urgent. Only clinic outreach may arrive then.
- **Opt-in, inside a tap.** Asked from the "Gentle reminders" switch, never on load; easy to turn off.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 | None; hairline or colour shift | Canvas sections, clinician table |
| 1 | Glass: blur(24px), 62% fill, 1px white edge | Default cards over the light field |
| 2 | Glass + soft warm shadow `0 12px 40px rgba(57,34,30,0.10)` | Insight card, active sheet |
| 3 | Scrim `rgba(28,27,26,0.35)` + level 2 | Modals, crisis sheet |

Shadows are always warm-tinted (espresso), soft and low-opacity.

## Shapes

| Token | Value | Use |
|---|---|---|
| `xs` | 4px | Tiny chips |
| `sm` | 8px | Small tiles |
| `md` | 12px | Inputs |
| `lg` | 24px | Cards, sheets |
| `xl` | 40px | Hero cards, bottom sheet top corners |
| `full` | 9999px | Buttons, chips, orb, avatars, mood scale |

Everything is rounded; there are no sharp corners on patient screens.

## Components

**Light field**: behind every patient screen (see Motion).

**Orb**: the check-in centrepiece. 220px circle of the field's colours with a soft inner glow. Idle: breathing. Recording: reacts to the voice. Done: settles and brightens.

**Buttons**: `button-primary` (dusk blue, 56px tall, one per screen) · `button-secondary` (stone) · `button-ghost` (outline stone) · `button-icon` (48px circle) · `button-care` (terracotta, crisis only). All pills. Minimum target 48×48.

**Glass card**: the default container. **Insight card**: an eyebrow ("I NOTICED"), a Fraunces `heading-2` headline, one or two sentences of `body`, and one action. A 3px gold-soft bar on the left edge.

**Signal row**: label (sleep, rhythm, voice, mood), a soft sparkline in olive over a sage-pale **"your usual" band**, and a plain-language delta ("a little later than usual"). No red or green, no arrows of judgement, no numbers unless tapped.

**Mood scale**: five 52px circles tinted from clay (1) to gold (5), each with a one-word caption on tap. One tap is enough.

**Chips**: suggestions and filters ("Walk outside · 10 min").

**Circle (social)**: avatars (initials for friends, abstract blob glyphs for anonymous peers), a soft status line ("checked in this morning", "quiet for 3 days"), a 64px `wave-button` and preset messages as chips. Chat bubbles: self in dusk blue, others white.

**Crisis sheet**: always one tap away (the care button in the header menu and on the Circle tab). It's a calm bottom sheet with local helplines, "message my clinician", and "message someone in my circle".

**Tab bar**: glass and safe-area aware: Today · Check in · Circle · Calm.

**Clinician table**: plain canvas, eyebrow headers, a care-coloured dot for "needs a call", and a short AI-written summary per patient.

**Demo controls**: a hidden presenter drawer for the time slider and persona day, opened with `?demo=1` or a long-press on the logo.

## Voice & Copy

- Warm, plain, second person, short. Like a kind friend who notices, not a doctor or a coach.
- **Notice, don't diagnose:** "Your sleep has been drifting later this week" rather than "Sleep disruption detected".
- **Relative to you:** "quieter than your usual" rather than "volume 42 dB".
- **Invite, don't instruct:** "Would a short walk help today?" rather than "Go for a walk."
- Never use these words with the user: *risk, relapse, score, warning, failed, missed, streak*. The clinician view may use clinical language.
- Celebrate gently ("That walk seemed to help. Noted."), with no gamified pressure and no streak counters that can be broken.
- Greet by time of day and name.

## Accessibility

- Text meets WCAG AA (4.5:1 body, 3:1 large). Verify on the darkest and lightest light-field states with glass cards.
- Touch targets ≥ 48px. The primary action sits in the thumb zone.
- `prefers-reduced-motion` and `prefers-color-scheme` are respected, and dark mode is a first-class design.
- Voice check-in always has a tap/typing alternative ("I'd rather not talk today" → mood scale + optional text).
- Never convey meaning with colour alone; always pair it with words.

## Do's and Don'ts

### Do
- Default to the warm canvas and the light field. Content floats on glass.
- Keep one dusk-blue action per screen, in the bottom third.
- Use Fraunces for feeling and Inter for facts.
- Show every signal against the person's own usual range.
- Let the field and sound respond to mood, slowly.
- Leave lots of space. One idea per screen.

### Don't
- Don't use white or pure black as page backgrounds.
- Don't put gold, clay or sage on buttons; they belong to the field, data and illustration.
- Don't use red, alarms, scores, grades, streaks or judgemental arrows on patient screens.
- Don't animate quickly, bounce, shake or flash. Don't autoplay sound before the Begin tap.
- Don't make users type when a tap will do.
- Don't use the care colour for anything except crisis and the clinician flag.
