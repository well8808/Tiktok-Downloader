# AGENTS.md

> Configuration for AI agents (Codex, Claude Code, Cursor, etc.) working in this repository. Read this first.

## What this project is

**TikTok Downloader** — local single-user Next.js 14 app for downloading TikTok videos in max quality, no watermark, with automatic metadata stripping. Runs on `localhost:3000`. Single-machine, Windows 11. Not a SaaS, no auth, no multi-tenant.

## Stack

- Next.js 14 App Router
- TypeScript strict + `noUncheckedIndexedAccess` + `noImplicitOverride`
- Tailwind CSS with custom personality tokens (see `tailwind.config.ts`)
- Prisma + SQLite (`prisma/dev.db`)
- Framer Motion (used sparingly)
- lucide-react icons (no emojis anywhere)
- Geist Sans + Geist Mono fonts
- canvas-confetti was removed; current confetti uses `@tsparticles/confetti`
- soundcn sound effects (CC0 Kenney MP3s as base64 modules in `lib/sounds/`)
- `@number-flow/react` for animated counters

## Commands

| Task | Command |
|---|---|
| Dev server (port 3000) | `npm run dev` |
| Production build | `npm run build` |
| TypeScript strict check | `npx tsc --noEmit` |
| Unit tests (Vitest) | `npm test` |
| E2E tests (Playwright) | `npm run test:e2e` |
| Download binaries (yt-dlp/ffmpeg) | `npm run bootstrap` |
| Prisma push | `npm run db:push` |

**Done means:** `npx tsc --noEmit` returns 0 errors AND `npm test` is green AND `npm run build` is green AND, if UI changed, `npm run test:e2e` is green.

## File layout (high signal)

```
app/
  (main)/           → Routed pages (layout w/ sidebar)
  actions/          → Server Actions (probe, download, batch, cancel, history, config, redownload)
  api/              → SSE progress route + open-folder route
  layout.tsx        → Root layout (Geist font, dynamic title)
  globals.css       → Tokens + utilities + custom scrollbar
  icon.svg          → Favicon (SVG monogram, black bg + white glyph)
  apple-icon.svg    → 180px Apple touch icon
components/
  primitives/       → kbd, progress-bar, status-icon, monogram, tooltip,
                      stagger, shimmer-button, glare-card, sparkles,
                      multi-step-loader
  shell/            → sidebar, auto-resume-toast, page-transition,
                      keyboard-nav, global-paste
  single/           → url-input, preview-card, progress-card
  batch/            → url-list-input, job-list
  history/          → empty-state, history-item, skeleton
  settings/         → settings-form, toggle-row, folder-picker,
                      updater-row, volume-slider
lib/
  downloader/       → types, errors, url-validator, ytdlp, ffmpeg, orchestrator
  sounds/           → 7 .ts modules with MP3 base64 inline (soundcn/Kenney)
  sound.ts          → SoundEngine using sound-engine + sounds
  sound-engine.ts   → soundcn Web Audio decoder + cache
  sound-types.ts    → SoundAsset type
  use-sound.ts      → React hook for sound prefs + reduced-motion
  use-sound-effect.ts → soundcn's useSound (not currently consumed)
  confetti.ts       → tsparticles wrappers (fireCompletionConfetti, fireProbeSparkle)
  config.ts         → AppSettings (downloadFolder, autoStripMetadata, etc.)
  db.ts             → Prisma client singleton
  paths.ts          → bin/.tmp/logs resolvers
  logger.ts         → JSON-lines logger (URL-hashing by default)
  progress-bus.ts   → EventEmitter for SSE
  queue.ts          → In-memory concurrency-2 queue
  updater.ts        → Auto-update yt-dlp from GitHub releases
  cn.ts             → clsx + tailwind-merge helper
prisma/schema.prisma → Job + Setting models
tests/
  unit/             → 4 specs, 27 tests (errors, url-validator, ytdlp-parser, queue)
  e2e/              → 3 specs, 7 tests (single-flow, batch-flow, settings-flow)
  fixtures/         → yt-dlp stderr samples
scripts/bootstrap.ps1 → Downloads yt-dlp.exe + ffmpeg.exe to bin/
public/             → Empty (intentional). Image assets should go here.
docs/superpowers/   → spec + plan (read-only reference)
HANDOFF.md          → Initial briefing from the build session
RESULTADO.md        → Implementation report
validation/         → Latest Playwright MCP screenshots + accessibility snapshots
```

## Personality tokens (locked — do not change)

| Token | Value |
|---|---|
| vibe | utilitarian + premium (Linear / Vercel / Raycast tier) |
| radius | `md` (6px) — never `sm` (harsh) or `lg+` (AI default) |
| font | Geist Sans body, Geist Mono for URLs / IDs / paths / timestamps |
| color temp | neutral cool (`hsl(240 5% X%)` grays) |
| density | balanced (`p-5` cards, `gap-8` between sections) |

Palette:
```
bg            hsl(0 0% 0%)
surface       hsl(240 5% 6%)
surface-hover hsl(240 5% 9%)
border        hsl(240 5% 14%)
text-primary  hsl(0 0% 95%)
text-muted    hsl(240 5% 55%)
text-subtle   hsl(240 5% 35%)
accent        hsl(263 70% 58%)  ← purple, only on primary action
accent-press  hsl(263 70% 48%)
success       hsl(150 60% 50%)
warning       hsl(38 92% 55%)
danger        hsl(0 70% 55%)
```

## Aesthetic rules (non-negotiable)

These exist because the user is a marketing/design-sensitive person who explicitly banned generic AI aesthetics. Treat them as hard constraints.

- **No emojis anywhere.** UI, comments, commit messages, alt text — never. Use lucide-react icons.
- **No "AI-default" patterns**: no glassmorphism without purpose, no gradient blobs, no radial blur orbs, no centered hero with gradient background + 2 buttons subtitle, no `shadow-xl` on cards, no shadcn-defaults applied unchanged, no microcopy like "Welcome!" / "Get Started" / "Aw shucks!".
- **Premium but not harsh** (Linear/Vercel/Raycast — not Hyper/brutalist): radius never sharper than `md`, borders in `hsl(240 5% 14%)` or subtler, never `border-2` pure black.
- **One primary action per context.** Purple `hsl(263 70% 58%)` is reserved for primary CTAs — do not paint navigation/icons/hover states with it.
- **Grayscale-first hierarchy.** UI must read in B/W before color enters.
- **Hand-craft details over decoration.** Short jobId visible, mono timestamps, kbd pills, `border-b-2 accent-press` on primary buttons (not shadow).
- **Microcopy in pt-BR**, dry and specific. The spec at `docs/superpowers/specs/2026-05-27-tiktok-downloader-design.md` §6.6 has the locked text — use verbatim when re-writing strings.

## Things NOT to touch

- `lib/downloader/*` (engine logic — change only if explicitly requested)
- `lib/active-processes.ts`, `lib/queue.ts`, `lib/orchestrator.ts`
- `prisma/schema.prisma` (database shape)
- `tests/unit/*` and `tests/e2e/*` — never modify tests to make them pass; fix the code instead
- `.gitignore`, `HANDOFF.md`, `docs/` — frozen reference
- `bin/` (binary outputs) — git-ignored
- Server Actions and SSE plumbing — only modify if the visual change requires new data

## Codex-specific notes

- The image generation tool (`$imagegen` / `gpt-image-2`) places output in `~/.codex/generated_images/`. **Move** generated assets to `public/` (e.g. `public/mascot.png`, `public/og-image.png`) and reference them via the Next.js `next/image` component or plain `<img>` for SVG-equivalent uses.
- Prefer SVG when the asset is line-art or geometric (smaller, scales, themeable). Use PNG when the asset is illustrated/textured.
- After moving an image, ensure it has appropriate `alt` text (or `alt=""` if purely decorative) and respects `prefers-reduced-motion` when animated.
- Generate images sequentially (the image tool does not parallelize).

## Decision rules (judgment calls)

- **If** a visual addition feels generic / AI-cookbook → discard and propose another. **Otherwise** integrate.
- **If** unsure about an aesthetic call → choose the more restrained option. **Otherwise** ship it.
- **If** a change requires touching engine/server code to enable a visual feature → stop and ask. **Otherwise** proceed.
- **If** a test fails → fix the implementation, not the test. **If** the test was wrong, ask before editing it.
- **If** `npm run build` fails or `npx tsc --noEmit` errors → fix before committing.

## Git conventions

- Commit style: `feat: …`, `fix: …`, `chore: …`, `docs: …` (no emoji prefix)
- Commit messages in pt-BR are fine — match the existing style (see `git log --oneline`)
- Atomic commits: one logical change per commit, not a wall of unrelated edits
- Co-author trailer when relevant
- Never `--no-verify`, never force-push to main
