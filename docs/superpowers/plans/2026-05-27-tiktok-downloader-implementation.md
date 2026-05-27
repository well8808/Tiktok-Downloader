# TikTok Downloader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Next.js 14 app that downloads TikTok videos in max quality without watermark, strips metadata automatically, supports single + batch modes, and feels premium (Linear/Vercel-tier — never AI-generic, never harsh).

**Architecture:** Next.js App Router + Server Actions for orchestration, SQLite (Prisma) for job persistence, child_process.spawn to drive bundled yt-dlp.exe + ffmpeg.exe binaries. SSE streams progress. Atomic pipeline: probe → download to .tmp → strip metadata → validate → move to final destination. UI: 4 screens (Single, Batch, History, Settings) behind a 56px icon sidebar. Personality locked: utilitarian+premium, radius `md`, Geist Sans + Geist Mono accent, cool/neutral grays, balanced density.

**Tech Stack:** Next.js 14 · TypeScript strict · Tailwind CSS · shadcn/ui (Button, Input, Textarea, Toast, Tooltip only) · lucide-react · Framer Motion · Prisma + SQLite · @paralleldrive/cuid2 · Geist font (Sans + Mono) · Vitest (unit tests) · Playwright (e2e validation)

**Reference docs:**
- Spec: `docs/superpowers/specs/2026-05-27-tiktok-downloader-design.md`
- Aesthetic memories: `[[feedback-no-ai-aesthetic]]`, `[[feedback-premium-not-harsh]]`, `[[feedback-no-emojis-use-icons]]`
- Design system: `D:\Projetos\nossosmomentos\references\refactoring-ui-master.md`

---

## File Structure (locked decomposition)

```
tiktok-downloader/
├── app/
│   ├── (main)/
│   │   ├── layout.tsx                # Shell w/ sidebar + auto-resume mount
│   │   ├── page.tsx                  # Single mode (route /)
│   │   ├── batch/page.tsx            # Batch mode
│   │   ├── history/page.tsx          # History
│   │   └── settings/page.tsx         # Settings
│   ├── actions/
│   │   ├── probe.ts                  # Server Action: validate URL + fetch metadata
│   │   ├── download.ts               # Server Action: start single download
│   │   ├── batch.ts                  # Server Action: start batch queue
│   │   ├── cancel.ts                 # Server Action: cancel a job
│   │   ├── history.ts                # Server Actions: list, soft-delete, re-download
│   │   └── config.ts                 # Server Actions: get/set settings
│   ├── api/progress/[jobId]/route.ts # SSE stream of job progress
│   ├── globals.css                   # Tokens + Geist
│   └── layout.tsx                    # Root layout (font loader)
├── lib/
│   ├── downloader/
│   │   ├── types.ts                  # VideoInfo, JobState, ErrorCode
│   │   ├── errors.ts                 # tagError() — maps stderr → ErrorCode + msg
│   │   ├── url-validator.ts          # validateTikTokUrl()
│   │   ├── ytdlp.ts                  # probe() + download() wrappers
│   │   ├── ffmpeg.ts                 # stripMetadata() + extractMp3() + validateMp4()
│   │   └── orchestrator.ts           # runDownloadJob() — atomic pipeline
│   ├── queue.ts                      # In-memory queue, concurrency=2
│   ├── db.ts                         # Prisma client singleton
│   ├── config.ts                     # get/set typed settings
│   ├── updater.ts                    # Auto-update yt-dlp
│   ├── progress-bus.ts               # EventEmitter for SSE
│   ├── logger.ts                     # JSON-lines logger
│   └── paths.ts                      # Path resolvers (bin/, .tmp/, logs/)
├── components/
│   ├── shell/
│   │   ├── sidebar.tsx
│   │   └── auto-resume-toast.tsx
│   ├── single/
│   │   ├── url-input.tsx
│   │   ├── preview-card.tsx
│   │   └── progress-card.tsx
│   ├── batch/
│   │   ├── url-list-input.tsx
│   │   └── job-list.tsx
│   ├── history/
│   │   ├── empty-state.tsx
│   │   └── history-item.tsx
│   ├── settings/
│   │   ├── folder-picker.tsx
│   │   ├── toggle-row.tsx
│   │   └── updater-row.tsx
│   ├── primitives/                   # Hand-rolled tiny primitives
│   │   ├── kbd.tsx                   # ⌘V style pill
│   │   ├── progress-bar.tsx          # h-2px linear w/ ticks
│   │   └── status-icon.tsx           # ícone+cor por status
│   └── ui/                           # shadcn primitives (button, input, etc)
├── prisma/
│   └── schema.prisma
├── bin/                              # Downloaded by bootstrap (gitignored)
├── scripts/
│   └── bootstrap.ps1                 # Downloads yt-dlp.exe + ffmpeg.exe
├── tests/
│   ├── unit/
│   │   ├── url-validator.test.ts
│   │   ├── errors.test.ts
│   │   ├── ytdlp-parser.test.ts
│   │   └── queue.test.ts
│   ├── fixtures/
│   │   ├── ytdlp-success.json
│   │   ├── ytdlp-private.stderr.txt
│   │   └── ytdlp-geo.stderr.txt
│   ├── e2e/
│   │   ├── single-flow.spec.ts
│   │   ├── batch-flow.spec.ts
│   │   └── settings-flow.spec.ts
│   ├── reliability-suite.ts          # 15-URL smoke test
│   └── runs/                         # JSON results per run (gitignored)
├── public/                           # (empty for now)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.mjs
├── postcss.config.mjs
├── components.json                   # shadcn config
├── playwright.config.ts
├── vitest.config.ts
└── README.md (já existe)
```

---

## Milestone 1 — Scaffolding (Tasks 1-3)

### Task 1: Initialize Next.js project with TypeScript strict

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts`, `.eslintrc.json`
- Create: `app/layout.tsx`, `app/globals.css` (placeholder)

- [ ] **Step 1: Run create-next-app non-interactively**

```powershell
cd D:\Projetos\tiktok-downloader
npx create-next-app@14 . --typescript --tailwind --app --src-dir=false --import-alias="@/*" --no-eslint --use-npm
```
Expected: Project files written. Confirm `package.json` shows `"next": "14.x.x"`.

- [ ] **Step 2: Enable TypeScript strict mode**

Edit `tsconfig.json` — set `"strict": true` and add:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true
  }
}
```

- [ ] **Step 3: Install runtime deps**

```powershell
npm install lucide-react @paralleldrive/cuid2 framer-motion geist
npm install prisma @prisma/client
npm install class-variance-authority clsx tailwind-merge
```

- [ ] **Step 4: Install dev deps**

```powershell
npm install -D vitest @vitest/ui @types/node prettier
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 5: Add scripts to package.json**

Edit `package.json` `"scripts"`:
```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "reliability": "tsx tests/reliability-suite.ts",
  "bootstrap": "powershell -ExecutionPolicy Bypass -File scripts/bootstrap.ps1",
  "db:push": "prisma db push",
  "db:studio": "prisma studio"
}
```

Install `tsx`:
```powershell
npm install -D tsx
```

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "feat: scaffold Next.js 14 project with TS strict + deps"
```

---

### Task 2: Configure Tailwind tokens + Geist font + globals.css

**Files:**
- Modify: `tailwind.config.ts`, `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1: Replace tailwind.config.ts with personality tokens**

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "hsl(0 0% 0%)",
        surface: "hsl(240 5% 6%)",
        "surface-hover": "hsl(240 5% 9%)",
        border: "hsl(240 5% 14%)",
        "text-primary": "hsl(0 0% 95%)",
        "text-muted": "hsl(240 5% 55%)",
        "text-subtle": "hsl(240 5% 35%)",
        accent: "hsl(263 70% 58%)",
        "accent-press": "hsl(263 70% 48%)",
        success: "hsl(150 60% 50%)",
        warning: "hsl(38 92% 55%)",
        danger: "hsl(0 70% 55%)",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["14px", { lineHeight: "20px" }],
        lg: ["16px", { lineHeight: "22px" }],
        xl: ["20px", { lineHeight: "26px" }],
      },
      transitionTimingFunction: {
        "out-quad": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Replace app/globals.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    background: hsl(0 0% 0%);
    color: hsl(0 0% 95%);
    -webkit-font-smoothing: antialiased;
  }
  body {
    font-family: var(--font-geist-sans), system-ui, sans-serif;
    font-size: 14px;
    line-height: 20px;
  }
  ::selection {
    background: hsl(263 70% 58% / 0.3);
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  .label-track {
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
}
```

- [ ] **Step 3: Wire Geist font in root layout**

Replace `app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "TikTok Downloader",
  description: "Local TikTok video downloader",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="bg-bg text-text-primary">{children}</body>
    </html>
  );
}
```

- [ ] **Step 4: Smoke-test dev server**

```powershell
npm run dev
```
Expected: server boots at http://localhost:3000 without errors. Page renders (default Next page or 404 — both fine).
Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```powershell
git add tailwind.config.ts app/globals.css app/layout.tsx
git commit -m "feat: personality tokens + Geist font in Tailwind"
```

---

### Task 3: Prisma schema + first migration

**Files:**
- Create: `prisma/schema.prisma`, `lib/db.ts`

- [ ] **Step 1: Create prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Job {
  id            String    @id
  url           String
  authorHandle  String?
  title         String?
  durationSec   Int?
  thumbnailUrl  String?
  status        String    @default("PENDING")
  errorCode     String?
  errorMessage  String?
  filePath      String?
  audioPath     String?
  fileSizeBytes Int?
  createdAt     DateTime  @default(now())
  startedAt     DateTime?
  finishedAt    DateTime?
  isBatch       Boolean   @default(false)
  batchId       String?
  deletedAt     DateTime?

  @@index([status])
  @@index([batchId])
  @@index([deletedAt])
}

model Setting {
  key   String @id
  value String
}
```

(Note: SQLite doesn't support Prisma enums, so `status` is `String`. Valid values defined in `lib/downloader/types.ts`.)

- [ ] **Step 2: Generate client + push schema**

```powershell
npx prisma generate
npx prisma db push
```
Expected: `prisma/dev.db` created. `node_modules/.prisma/client` populated.

- [ ] **Step 3: Create lib/db.ts singleton**

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
```

- [ ] **Step 4: Commit**

```powershell
git add prisma/schema.prisma lib/db.ts package.json
git commit -m "feat: Prisma schema (Job + Setting) + SQLite + db singleton"
```

---

## Milestone 2 — Core lib types + validators (Tasks 4-5)

### Task 4: Types + Error tagger (TDD)

**Files:**
- Create: `lib/downloader/types.ts`, `lib/downloader/errors.ts`
- Test: `tests/unit/errors.test.ts`, `tests/fixtures/ytdlp-private.stderr.txt`, `tests/fixtures/ytdlp-geo.stderr.txt`

- [ ] **Step 1: Create types.ts**

```ts
export type JobStatus =
  | "PENDING"
  | "VALIDATING"
  | "DOWNLOADING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type ErrorCode =
  | "private_or_deleted"
  | "geo_blocked"
  | "invalid_url"
  | "rate_limited"
  | "network"
  | "ytdlp_failed"
  | "ffmpeg_failed";

export interface VideoInfo {
  id: string;
  url: string;
  authorHandle: string;
  title: string;
  durationSec: number;
  thumbnailUrl: string;
  formats: string[];
}

export interface JobProgress {
  jobId: string;
  status: JobStatus;
  percent: number;
  message?: string;
}

export interface TaggedError {
  code: ErrorCode;
  message: string;
  detail?: string;
}
```

- [ ] **Step 2: Create fixtures with real yt-dlp stderr samples**

`tests/fixtures/ytdlp-private.stderr.txt`:
```
ERROR: [TikTok] 7234567890: Video unavailable. This video is private.
```

`tests/fixtures/ytdlp-geo.stderr.txt`:
```
ERROR: [TikTok] 7234567890: The uploader has not made this video available in your country.
```

- [ ] **Step 3: Write failing tests**

`tests/unit/errors.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tagError } from "@/lib/downloader/errors";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "../fixtures", name), "utf-8");

describe("tagError", () => {
  it("tags private video", () => {
    const result = tagError(fixture("ytdlp-private.stderr.txt"), 1);
    expect(result.code).toBe("private_or_deleted");
    expect(result.message).toBe("Esse vídeo está privado ou foi removido");
  });

  it("tags geo-blocked video", () => {
    const result = tagError(fixture("ytdlp-geo.stderr.txt"), 1);
    expect(result.code).toBe("geo_blocked");
    expect(result.message).toBe("Vídeo indisponível na sua região");
  });

  it("tags rate limit", () => {
    const result = tagError("HTTP Error 429: Too Many Requests", 1);
    expect(result.code).toBe("rate_limited");
  });

  it("falls back to ytdlp_failed for unknown stderr", () => {
    const result = tagError("ERROR: something weird happened", 1);
    expect(result.code).toBe("ytdlp_failed");
    expect(result.detail).toContain("something weird");
  });

  it("returns network code when exit is null (process killed)", () => {
    const result = tagError("", null);
    expect(result.code).toBe("network");
  });
});
```

- [ ] **Step 4: Add vitest config**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
});
```

- [ ] **Step 5: Run tests → expect failure**

```powershell
npm test
```
Expected: tests fail with "tagError not defined".

- [ ] **Step 6: Implement lib/downloader/errors.ts**

```ts
import type { TaggedError, ErrorCode } from "./types";

const PATTERNS: Array<{ regex: RegExp; code: ErrorCode; message: string }> = [
  {
    regex: /private|unavailable|not.+available.+private|deleted|removed/i,
    code: "private_or_deleted",
    message: "Esse vídeo está privado ou foi removido",
  },
  {
    regex: /not.+available.+country|geo[\s-]?block|region[\s-]?lock/i,
    code: "geo_blocked",
    message: "Vídeo indisponível na sua região",
  },
  {
    regex: /HTTP Error 429|Too Many Requests|rate.?limit/i,
    code: "rate_limited",
    message: "TikTok limitou as requisições. Aguarde 2 minutos e tente de novo.",
  },
];

export function tagError(stderr: string, exitCode: number | null): TaggedError {
  if (exitCode === null) {
    return { code: "network", message: "Sem conexão com a internet" };
  }
  for (const { regex, code, message } of PATTERNS) {
    if (regex.test(stderr)) {
      return { code, message, detail: stderr.trim().split("\n").slice(-3).join("\n") };
    }
  }
  return {
    code: "ytdlp_failed",
    message: "Erro ao baixar. Detalhes copiados pro clipboard. Tente atualizar o app.",
    detail: stderr.trim(),
  };
}

export function ffmpegError(stderr: string): TaggedError {
  return {
    code: "ffmpeg_failed",
    message: "Erro ao processar o arquivo. Detalhes copiados pro clipboard.",
    detail: stderr.trim().split("\n").slice(-3).join("\n"),
  };
}
```

- [ ] **Step 7: Run tests → expect pass**

```powershell
npm test
```
Expected: all 5 tests pass.

- [ ] **Step 8: Commit**

```powershell
git add lib/downloader/ tests/
git commit -m "feat: typed errors + tagError with stderr pattern matching"
```

---

### Task 5: URL validator (TDD)

**Files:**
- Create: `lib/downloader/url-validator.ts`
- Test: `tests/unit/url-validator.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/unit/url-validator.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { validateTikTokUrl } from "@/lib/downloader/url-validator";

describe("validateTikTokUrl", () => {
  it.each([
    "https://www.tiktok.com/@user/video/7234567890",
    "https://tiktok.com/@user/video/7234567890",
    "https://vm.tiktok.com/ZMabc123/",
    "https://m.tiktok.com/v/7234567890.html",
    "http://www.tiktok.com/@user/video/7234567890",
    "https://www.tiktok.com/@user/video/7234567890?_t=share",
  ])("accepts %s", (url) => {
    expect(validateTikTokUrl(url)).toBe(true);
  });

  it.each([
    "https://youtube.com/watch?v=abc",
    "https://tiktok.fake.com/video/123",
    "tiktok.com/@user/video/123",
    "https://www.tiktok",
    "",
    "not a url",
  ])("rejects %s", (url) => {
    expect(validateTikTokUrl(url)).toBe(false);
  });
});
```

- [ ] **Step 2: Run → expect fail**

```powershell
npm test tests/unit/url-validator.test.ts
```

- [ ] **Step 3: Implement**

`lib/downloader/url-validator.ts`:
```ts
const TIKTOK_URL = /^https?:\/\/(www\.|vm\.|m\.)?tiktok\.com\/.+/i;

export function validateTikTokUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!TIKTOK_URL.test(trimmed)) return false;
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

export function parseUrlList(text: string): string[] {
  return text
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}
```

- [ ] **Step 4: Run → expect pass**

- [ ] **Step 5: Commit**

```powershell
git add lib/downloader/url-validator.ts tests/unit/url-validator.test.ts
git commit -m "feat: URL validator with TikTok regex + multi-line parser"
```

---

## Milestone 3 — yt-dlp + ffmpeg wrappers + bootstrap (Tasks 6-9)

### Task 6: Path resolvers + logger + progress bus

**Files:**
- Create: `lib/paths.ts`, `lib/logger.ts`, `lib/progress-bus.ts`

- [ ] **Step 1: Create lib/paths.ts**

```ts
import { join, resolve } from "node:path";
import { mkdirSync, existsSync } from "node:fs";

const ROOT = resolve(process.cwd());

export const PATHS = {
  bin: join(ROOT, "bin"),
  ytdlpExe: join(ROOT, "bin", "yt-dlp.exe"),
  ffmpegExe: join(ROOT, "bin", "ffmpeg.exe"),
  ffprobeExe: join(ROOT, "bin", "ffprobe.exe"),
  tmp: join(ROOT, ".tmp"),
  logs: join(ROOT, "logs"),
};

export function ensureDirs() {
  for (const dir of [PATHS.bin, PATHS.tmp, PATHS.logs]) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  }
}
```

- [ ] **Step 2: Create lib/logger.ts**

```ts
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { PATHS, ensureDirs } from "./paths";

type LogEvent = {
  jobId?: string;
  url?: string;
  event: string;
  [k: string]: unknown;
};

let LOG_RAW_URL = false;
export function setLogRawUrl(value: boolean) {
  LOG_RAW_URL = value;
}

export function log(event: LogEvent) {
  ensureDirs();
  const date = new Date().toISOString().slice(0, 10);
  const file = join(PATHS.logs, `${date}.log`);
  const safe: LogEvent = { ...event, timestamp: new Date().toISOString() };
  if (safe.url && !LOG_RAW_URL) {
    safe.url_hash = createHash("sha256").update(String(safe.url)).digest("hex").slice(0, 16);
    delete safe.url;
  }
  appendFileSync(file, JSON.stringify(safe) + "\n", "utf-8");
}
```

- [ ] **Step 3: Create lib/progress-bus.ts**

```ts
import { EventEmitter } from "node:events";
import type { JobProgress } from "./downloader/types";

class ProgressBus extends EventEmitter {
  emitProgress(progress: JobProgress) {
    this.emit(progress.jobId, progress);
    this.emit("all", progress);
  }
}

const globalForBus = globalThis as unknown as { progressBus?: ProgressBus };
export const progressBus = globalForBus.progressBus ?? new ProgressBus();
progressBus.setMaxListeners(50);
if (process.env.NODE_ENV !== "production") globalForBus.progressBus = progressBus;
```

- [ ] **Step 4: Commit**

```powershell
git add lib/paths.ts lib/logger.ts lib/progress-bus.ts
git commit -m "feat: path resolvers + JSON-lines logger + progress event bus"
```

---

### Task 7: yt-dlp wrapper (probe + download with progress)

**Files:**
- Create: `lib/downloader/ytdlp.ts`
- Test: `tests/unit/ytdlp-parser.test.ts`, `tests/fixtures/ytdlp-success.json`, `tests/fixtures/ytdlp-progress.txt`

- [ ] **Step 1: Create fixture for probe success**

`tests/fixtures/ytdlp-success.json`:
```json
{
  "id": "7234567890",
  "uploader": "joao",
  "uploader_id": "joao",
  "title": "Caption do post de teste",
  "description": "Caption do post de teste #fyp",
  "duration": 32,
  "thumbnail": "https://p16-sign-va.tiktokcdn.com/abc.jpg",
  "formats": [{"format_id": "h264_540p", "ext": "mp4"}],
  "webpage_url": "https://www.tiktok.com/@joao/video/7234567890"
}
```

- [ ] **Step 2: Create progress fixture**

`tests/fixtures/ytdlp-progress.txt`:
```
[download] Destination: .tmp/abc.mp4
[download]   0.0% of 5.21MiB at Unknown speed ETA Unknown
[download]  23.4% of 5.21MiB at  1.20MiB/s ETA 00:03
[download]  87.2% of 5.21MiB at  2.10MiB/s ETA 00:00
[download] 100% of 5.21MiB in 00:02
```

- [ ] **Step 3: Write parser tests**

`tests/unit/ytdlp-parser.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseVideoInfo, parseProgressLine } from "@/lib/downloader/ytdlp";

const fixture = (name: string) =>
  readFileSync(join(__dirname, "../fixtures", name), "utf-8");

describe("parseVideoInfo", () => {
  it("parses yt-dlp --dump-json output", () => {
    const info = parseVideoInfo(fixture("ytdlp-success.json"), "https://tiktok.com/@joao/video/7234567890");
    expect(info.id).toBe("7234567890");
    expect(info.authorHandle).toBe("@joao");
    expect(info.title).toBe("Caption do post de teste");
    expect(info.durationSec).toBe(32);
    expect(info.thumbnailUrl).toContain("https://");
  });
});

describe("parseProgressLine", () => {
  it.each([
    ["[download]   0.0% of 5.21MiB at Unknown speed ETA Unknown", 0],
    ["[download]  23.4% of 5.21MiB at  1.20MiB/s ETA 00:03", 23.4],
    ["[download]  87.2% of 5.21MiB at  2.10MiB/s ETA 00:00", 87.2],
    ["[download] 100% of 5.21MiB in 00:02", 100],
  ])("extracts percent from %s", (line, expected) => {
    expect(parseProgressLine(line)).toBe(expected);
  });

  it("returns null for non-progress lines", () => {
    expect(parseProgressLine("[generic] foo bar")).toBeNull();
  });
});
```

- [ ] **Step 4: Run tests → expect fail**

- [ ] **Step 5: Implement lib/downloader/ytdlp.ts**

```ts
import { spawn } from "node:child_process";
import { PATHS } from "../paths";
import { progressBus } from "../progress-bus";
import { tagError } from "./errors";
import type { VideoInfo, TaggedError } from "./types";

export function parseVideoInfo(json: string, originalUrl: string): VideoInfo {
  const data = JSON.parse(json);
  const handle = data.uploader_id || data.uploader || "tiktok";
  return {
    id: String(data.id),
    url: originalUrl,
    authorHandle: handle.startsWith("@") ? handle : `@${handle}`,
    title: (data.title || data.description || "").slice(0, 200),
    durationSec: Number(data.duration) || 0,
    thumbnailUrl: data.thumbnail || "",
    formats: (data.formats || []).map((f: { format_id: string }) => f.format_id),
  };
}

const PROGRESS_RE = /^\[download\]\s+(\d+(?:\.\d+)?)%/;
export function parseProgressLine(line: string): number | null {
  const m = line.match(PROGRESS_RE);
  return m ? Number(m[1]) : null;
}

export async function probe(url: string): Promise<VideoInfo> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PATHS.ytdlpExe, [
      "--dump-json",
      "--no-warnings",
      "--no-playlist",
      url,
    ]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", () => reject({ code: "network", message: "Sem conexão com a internet" } satisfies TaggedError));
    proc.on("close", (code) => {
      if (code === 0 && stdout.trim()) {
        try {
          resolve(parseVideoInfo(stdout, url));
        } catch {
          reject(tagError(stderr || stdout, code));
        }
      } else {
        reject(tagError(stderr, code));
      }
    });
  });
}

export async function downloadVideo(
  jobId: string,
  url: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PATHS.ytdlpExe, [
      "--format", "bv*+ba/b[ext=mp4]/best",
      "--merge-output-format", "mp4",
      "--no-warnings",
      "--no-write-info-json",
      "--no-write-thumbnail",
      "--no-playlist",
      "--newline",
      "-o", outputPath,
      url,
    ]);
    let stderr = "";
    proc.stdout.on("data", (chunk) => {
      const lines = chunk.toString().split(/\r?\n/);
      for (const line of lines) {
        const pct = parseProgressLine(line);
        if (pct !== null) {
          progressBus.emitProgress({ jobId, status: "DOWNLOADING", percent: pct });
        }
      }
    });
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", () => reject({ code: "network", message: "Sem conexão com a internet" } satisfies TaggedError));
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(tagError(stderr, code));
    });
  });
}
```

- [ ] **Step 6: Run tests → expect pass**

```powershell
npm test
```

- [ ] **Step 7: Commit**

```powershell
git add lib/downloader/ytdlp.ts tests/
git commit -m "feat: yt-dlp probe + download wrappers with progress parsing"
```

---

### Task 8: ffmpeg wrapper (strip metadata, MP3 extract, mp4 validate)

**Files:**
- Create: `lib/downloader/ffmpeg.ts`

(No unit tests — ffmpeg is integration-tested via the orchestrator path. Wrapper is small and mostly pass-through.)

- [ ] **Step 1: Implement**

`lib/downloader/ffmpeg.ts`:
```ts
import { spawn } from "node:child_process";
import { PATHS } from "../paths";
import { ffmpegError } from "./errors";
import type { TaggedError } from "./types";

function run(exe: string, args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn(exe, args);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", () => reject({ code: "ffmpeg_failed", message: "ffmpeg não encontrado", detail: "" } satisfies TaggedError));
    proc.on("close", (code) => {
      if (code === 0) resolve({ stdout, stderr });
      else reject(ffmpegError(stderr));
    });
  });
}

export async function stripMetadata(inputPath: string, outputPath: string): Promise<void> {
  await run(PATHS.ffmpegExe, [
    "-y",
    "-i", inputPath,
    "-map_metadata", "-1",
    "-map_chapters", "-1",
    "-c", "copy",
    outputPath,
  ]);
}

export async function extractMp3(inputPath: string, outputPath: string): Promise<void> {
  await run(PATHS.ffmpegExe, [
    "-y",
    "-i", inputPath,
    "-vn",
    "-acodec", "libmp3lame",
    "-ab", "320k",
    "-ar", "44100",
    outputPath,
  ]);
}

export async function validateMp4(path: string): Promise<{ duration: number; sizeBytes: number }> {
  const { stdout } = await run(PATHS.ffprobeExe, [
    "-v", "error",
    "-show_entries", "format=duration,size",
    "-of", "default=noprint_wrappers=1:nokey=1",
    path,
  ]);
  const lines = stdout.trim().split(/\r?\n/);
  const duration = Number(lines[0] || 0);
  const sizeBytes = Number(lines[1] || 0);
  if (duration <= 0 || sizeBytes <= 0) {
    throw { code: "ffmpeg_failed", message: "Arquivo gerado é inválido", detail: stdout } satisfies TaggedError;
  }
  return { duration, sizeBytes };
}
```

- [ ] **Step 2: Commit**

```powershell
git add lib/downloader/ffmpeg.ts
git commit -m "feat: ffmpeg wrapper — strip metadata, MP3 extract, mp4 validate"
```

---

### Task 9: Bootstrap script (download yt-dlp + ffmpeg)

**Files:**
- Create: `scripts/bootstrap.ps1`, `lib/updater.ts`

- [ ] **Step 1: Create scripts/bootstrap.ps1**

```powershell
$ErrorActionPreference = "Stop"
$BinDir = Join-Path $PSScriptRoot "..\bin"
if (-not (Test-Path $BinDir)) { New-Item -ItemType Directory -Path $BinDir | Out-Null }

$YtDlp = Join-Path $BinDir "yt-dlp.exe"
$Ffmpeg = Join-Path $BinDir "ffmpeg.exe"
$Ffprobe = Join-Path $BinDir "ffprobe.exe"

# 1. yt-dlp
if (-not (Test-Path $YtDlp)) {
  Write-Host "Baixando yt-dlp..."
  Invoke-WebRequest -UseBasicParsing `
    -Uri "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe" `
    -OutFile $YtDlp
  Write-Host "yt-dlp instalado."
} else {
  Write-Host "yt-dlp já existe."
}

# 2. ffmpeg + ffprobe (essentials build)
if (-not (Test-Path $Ffmpeg) -or -not (Test-Path $Ffprobe)) {
  Write-Host "Baixando ffmpeg..."
  $ZipPath = Join-Path $env:TEMP "ffmpeg.zip"
  Invoke-WebRequest -UseBasicParsing `
    -Uri "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip" `
    -OutFile $ZipPath
  $ExtractDir = Join-Path $env:TEMP "ffmpeg-extract"
  if (Test-Path $ExtractDir) { Remove-Item -Recurse -Force $ExtractDir }
  Expand-Archive -Path $ZipPath -DestinationPath $ExtractDir -Force
  $FfmpegBin = Get-ChildItem -Path $ExtractDir -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1
  $FfprobeBin = Get-ChildItem -Path $ExtractDir -Recurse -Filter "ffprobe.exe" | Select-Object -First 1
  Copy-Item $FfmpegBin.FullName $Ffmpeg
  Copy-Item $FfprobeBin.FullName $Ffprobe
  Remove-Item $ZipPath -Force
  Remove-Item -Recurse -Force $ExtractDir
  Write-Host "ffmpeg + ffprobe instalados."
} else {
  Write-Host "ffmpeg já existe."
}

Write-Host "Bootstrap completo."
```

- [ ] **Step 2: Run bootstrap**

```powershell
npm run bootstrap
```
Expected: `bin/yt-dlp.exe`, `bin/ffmpeg.exe`, `bin/ffprobe.exe` exist.

Verify:
```powershell
.\bin\yt-dlp.exe --version
.\bin\ffmpeg.exe -version
```

- [ ] **Step 3: Implement lib/updater.ts (yt-dlp auto-update check)**

```ts
import { writeFileSync, renameSync, statSync, existsSync } from "node:fs";
import { PATHS } from "./paths";
import { db } from "./db";

const YTDLP_RELEASES = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function checkAndUpdateYtdlp(force = false): Promise<{ updated: boolean; version: string }> {
  const last = await db.setting.findUnique({ where: { key: "lastUpdateCheck" } });
  if (!force && last) {
    const ts = Number(last.value);
    if (Date.now() - ts < ONE_DAY_MS) {
      const current = await db.setting.findUnique({ where: { key: "ytdlpVersion" } });
      return { updated: false, version: current?.value ?? "unknown" };
    }
  }
  const res = await fetch(YTDLP_RELEASES, { headers: { "User-Agent": "tiktok-downloader" } });
  if (!res.ok) throw new Error(`GitHub API failed: ${res.status}`);
  const data = (await res.json()) as { tag_name: string; assets: Array<{ name: string; browser_download_url: string }> };
  const tag = data.tag_name;
  const current = await db.setting.findUnique({ where: { key: "ytdlpVersion" } });
  await db.setting.upsert({
    where: { key: "lastUpdateCheck" },
    create: { key: "lastUpdateCheck", value: String(Date.now()) },
    update: { value: String(Date.now()) },
  });
  if (current?.value === tag && existsSync(PATHS.ytdlpExe)) {
    return { updated: false, version: tag };
  }
  const asset = data.assets.find((a) => a.name === "yt-dlp.exe");
  if (!asset) throw new Error("yt-dlp.exe asset not found in release");
  const dl = await fetch(asset.browser_download_url);
  if (!dl.ok) throw new Error(`Download failed: ${dl.status}`);
  const buf = Buffer.from(await dl.arrayBuffer());
  if (buf.length < 5_000_000) throw new Error("Downloaded file too small");
  const tmpPath = `${PATHS.ytdlpExe}.new`;
  writeFileSync(tmpPath, buf);
  if (existsSync(PATHS.ytdlpExe)) {
    try { renameSync(PATHS.ytdlpExe, `${PATHS.ytdlpExe}.bak`); } catch {}
  }
  renameSync(tmpPath, PATHS.ytdlpExe);
  await db.setting.upsert({
    where: { key: "ytdlpVersion" },
    create: { key: "ytdlpVersion", value: tag },
    update: { value: tag },
  });
  return { updated: true, version: tag };
}
```

- [ ] **Step 4: Commit**

```powershell
git add scripts/bootstrap.ps1 lib/updater.ts
git commit -m "feat: bootstrap script + yt-dlp auto-updater"
```

---

## Milestone 4 — Orchestrator + Queue + Config (Tasks 10-12)

### Task 10: Atomic orchestrator pipeline

**Files:**
- Create: `lib/downloader/orchestrator.ts`, `lib/config.ts`

- [ ] **Step 1: Create lib/config.ts**

```ts
import { db } from "./db";
import { homedir } from "node:os";
import { join } from "node:path";

export type AppSettings = {
  downloadFolder: string;
  autoStripMetadata: boolean;
  alwaysExtractMp3: boolean;
  logRawUrl: boolean;
};

const DEFAULTS: AppSettings = {
  downloadFolder: join(homedir(), "Videos", "TikTok"),
  autoStripMetadata: true,
  alwaysExtractMp3: false,
  logRawUrl: false,
};

export async function getSettings(): Promise<AppSettings> {
  const rows = await db.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    downloadFolder: map.get("downloadFolder") ?? DEFAULTS.downloadFolder,
    autoStripMetadata: (map.get("autoStripMetadata") ?? "true") === "true",
    alwaysExtractMp3: (map.get("alwaysExtractMp3") ?? "false") === "true",
    logRawUrl: (map.get("logRawUrl") ?? "false") === "true",
  };
}

export async function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
  const str = String(value);
  await db.setting.upsert({
    where: { key },
    create: { key, value: str },
    update: { value: str },
  });
}
```

- [ ] **Step 2: Implement orchestrator**

`lib/downloader/orchestrator.ts`:
```ts
import { join } from "node:path";
import { mkdirSync, renameSync, unlinkSync, existsSync, statSync } from "node:fs";
import { PATHS, ensureDirs } from "../paths";
import { db } from "../db";
import { log } from "../logger";
import { progressBus } from "../progress-bus";
import { getSettings } from "../config";
import { probe, downloadVideo } from "./ytdlp";
import { stripMetadata, extractMp3, validateMp4 } from "./ffmpeg";
import type { TaggedError, VideoInfo } from "./types";

const SAFE_FILENAME = /[^a-zA-Z0-9_-]/g;
function safeAuthor(handle: string): string {
  return handle.replace(/^@/, "").replace(SAFE_FILENAME, "").slice(0, 20) || "tiktok";
}

export async function runDownloadJob(
  jobId: string,
  url: string,
  info: VideoInfo,
  opts: { extractMp3?: boolean } = {}
): Promise<{ filePath: string; audioPath?: string; sizeBytes: number }> {
  ensureDirs();
  const settings = await getSettings();
  const tmpRaw = join(PATHS.tmp, `${jobId}-raw.mp4`);
  const tmpClean = join(PATHS.tmp, `${jobId}-clean.mp4`);
  const tmpAudio = join(PATHS.tmp, `${jobId}.mp3`);

  try {
    await db.job.update({
      where: { id: jobId },
      data: { status: "DOWNLOADING", startedAt: new Date() },
    });
    progressBus.emitProgress({ jobId, status: "DOWNLOADING", percent: 0 });
    log({ jobId, url, event: "download_start" });

    await downloadVideo(jobId, url, tmpRaw);

    progressBus.emitProgress({ jobId, status: "PROCESSING", percent: 100, message: "Removendo metadados" });
    await db.job.update({ where: { id: jobId }, data: { status: "PROCESSING" } });

    if (settings.autoStripMetadata) {
      await stripMetadata(tmpRaw, tmpClean);
      try { unlinkSync(tmpRaw); } catch {}
    } else {
      renameSync(tmpRaw, tmpClean);
    }

    const validation = await validateMp4(tmpClean);

    let audioPath: string | undefined;
    if (opts.extractMp3 || settings.alwaysExtractMp3) {
      progressBus.emitProgress({ jobId, status: "PROCESSING", percent: 100, message: "Extraindo áudio" });
      await extractMp3(tmpClean, tmpAudio);
    }

    const date = new Date().toISOString().slice(0, 10);
    const destDir = join(settings.downloadFolder, date);
    mkdirSync(destDir, { recursive: true });
    const fileName = `${safeAuthor(info.authorHandle)}_${jobId}.mp4`;
    const finalPath = join(destDir, fileName);
    renameSync(tmpClean, finalPath);

    if (existsSync(tmpAudio)) {
      const finalAudio = join(destDir, fileName.replace(/\.mp4$/, ".mp3"));
      renameSync(tmpAudio, finalAudio);
      audioPath = finalAudio;
    }

    await db.job.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        filePath: finalPath,
        audioPath: audioPath ?? null,
        fileSizeBytes: validation.sizeBytes,
        finishedAt: new Date(),
      },
    });
    progressBus.emitProgress({ jobId, status: "COMPLETED", percent: 100 });
    log({ jobId, url, event: "download_complete", sizeBytes: validation.sizeBytes });

    return { filePath: finalPath, audioPath, sizeBytes: validation.sizeBytes };
  } catch (err) {
    for (const p of [tmpRaw, tmpClean, tmpAudio]) {
      try { if (existsSync(p)) unlinkSync(p); } catch {}
    }
    const tagged = err as TaggedError;
    await db.job.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorCode: tagged.code,
        errorMessage: tagged.message,
        finishedAt: new Date(),
      },
    });
    progressBus.emitProgress({ jobId, status: "FAILED", percent: 0, message: tagged.message });
    log({ jobId, url, event: "download_failed", errorCode: tagged.code, detail: tagged.detail });
    throw tagged;
  }
}
```

- [ ] **Step 3: Commit**

```powershell
git add lib/downloader/orchestrator.ts lib/config.ts
git commit -m "feat: atomic orchestrator pipeline + settings module"
```

---

### Task 11: In-memory queue with concurrency 2 (TDD)

**Files:**
- Create: `lib/queue.ts`
- Test: `tests/unit/queue.test.ts`

- [ ] **Step 1: Write tests**

`tests/unit/queue.test.ts`:
```ts
import { describe, it, expect, vi } from "vitest";
import { Queue } from "@/lib/queue";

describe("Queue", () => {
  it("runs up to N jobs concurrently", async () => {
    const q = new Queue(2);
    const inFlight: number[] = [];
    const peak = { value: 0 };
    const makeJob = (ms: number) => async () => {
      inFlight.push(1);
      peak.value = Math.max(peak.value, inFlight.length);
      await new Promise((r) => setTimeout(r, ms));
      inFlight.pop();
    };
    await Promise.all([
      q.add(makeJob(30)),
      q.add(makeJob(30)),
      q.add(makeJob(30)),
      q.add(makeJob(30)),
    ]);
    expect(peak.value).toBeLessThanOrEqual(2);
  });

  it("propagates errors per-job without halting queue", async () => {
    const q = new Queue(2);
    const results = await Promise.allSettled([
      q.add(async () => { throw new Error("boom"); }),
      q.add(async () => "ok"),
    ]);
    expect(results[0].status).toBe("rejected");
    expect(results[1].status).toBe("fulfilled");
  });
});
```

- [ ] **Step 2: Run → expect fail**

- [ ] **Step 3: Implement**

`lib/queue.ts`:
```ts
type Task<T> = () => Promise<T>;

export class Queue {
  private running = 0;
  private pending: Array<() => void> = [];

  constructor(private readonly concurrency: number) {}

  async add<T>(task: Task<T>): Promise<T> {
    if (this.running >= this.concurrency) {
      await new Promise<void>((resolve) => this.pending.push(resolve));
    }
    this.running++;
    try {
      return await task();
    } finally {
      this.running--;
      const next = this.pending.shift();
      if (next) next();
    }
  }
}

const globalForQueue = globalThis as unknown as { downloadQueue?: Queue };
export const downloadQueue = globalForQueue.downloadQueue ?? new Queue(2);
if (process.env.NODE_ENV !== "production") globalForQueue.downloadQueue = downloadQueue;
```

- [ ] **Step 4: Run → expect pass**

- [ ] **Step 5: Commit**

```powershell
git add lib/queue.ts tests/unit/queue.test.ts
git commit -m "feat: concurrency-bounded queue (n=2)"
```

---

### Task 12: Server Actions + SSE route

**Files:**
- Create: `app/actions/probe.ts`, `app/actions/download.ts`, `app/actions/batch.ts`, `app/actions/cancel.ts`, `app/actions/history.ts`, `app/actions/config.ts`
- Create: `app/api/progress/[jobId]/route.ts`

- [ ] **Step 1: app/actions/probe.ts**

```ts
"use server";

import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { probe } from "@/lib/downloader/ytdlp";
import { validateTikTokUrl } from "@/lib/downloader/url-validator";
import type { VideoInfo } from "@/lib/downloader/types";

export async function probeUrl(url: string): Promise<
  | { ok: true; info: VideoInfo; jobId: string }
  | { ok: false; errorCode: string; message: string }
> {
  if (!validateTikTokUrl(url)) {
    return {
      ok: false,
      errorCode: "invalid_url",
      message: "Esse link não parece ser do TikTok. Cole o link completo do post.",
    };
  }
  try {
    const info = await probe(url);
    const jobId = createId().slice(0, 8);
    await db.job.create({
      data: {
        id: jobId,
        url,
        authorHandle: info.authorHandle,
        title: info.title,
        durationSec: info.durationSec,
        thumbnailUrl: info.thumbnailUrl,
        status: "VALIDATING",
      },
    });
    return { ok: true, info, jobId };
  } catch (err) {
    const e = err as { code: string; message: string };
    return { ok: false, errorCode: e.code, message: e.message };
  }
}
```

- [ ] **Step 2: app/actions/download.ts**

```ts
"use server";

import { db } from "@/lib/db";
import { runDownloadJob } from "@/lib/downloader/orchestrator";

export async function startDownload(
  jobId: string,
  opts: { extractMp3?: boolean } = {}
): Promise<{ ok: true } | { ok: false; errorCode: string; message: string }> {
  const job = await db.job.findUnique({ where: { id: jobId } });
  if (!job) return { ok: false, errorCode: "invalid_url", message: "Job não encontrado" };
  const info = {
    id: job.id,
    url: job.url,
    authorHandle: job.authorHandle ?? "@tiktok",
    title: job.title ?? "",
    durationSec: job.durationSec ?? 0,
    thumbnailUrl: job.thumbnailUrl ?? "",
    formats: [],
  };
  runDownloadJob(jobId, job.url, info, opts).catch(() => {});
  return { ok: true };
}
```

(Fire-and-forget: orchestrator updates DB + emits SSE; the client subscribes to progress via SSE.)

- [ ] **Step 3: app/actions/batch.ts**

```ts
"use server";

import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { probe } from "@/lib/downloader/ytdlp";
import { validateTikTokUrl, parseUrlList } from "@/lib/downloader/url-validator";
import { runDownloadJob } from "@/lib/downloader/orchestrator";
import { downloadQueue } from "@/lib/queue";

export async function startBatch(text: string): Promise<
  | { ok: true; batchId: string; jobIds: string[] }
  | { ok: false; message: string }
> {
  const urls = parseUrlList(text);
  if (urls.length === 0) return { ok: false, message: "Cole pelo menos uma URL" };
  if (urls.length > 100) return { ok: false, message: "Máximo 100 URLs por lote" };
  const batchId = createId().slice(0, 8);
  const jobIds: string[] = [];

  for (const url of urls) {
    const jobId = createId().slice(0, 8);
    jobIds.push(jobId);
    const isValid = validateTikTokUrl(url);
    await db.job.create({
      data: {
        id: jobId,
        url,
        status: isValid ? "PENDING" : "FAILED",
        errorCode: isValid ? null : "invalid_url",
        errorMessage: isValid ? null : "URL inválida",
        isBatch: true,
        batchId,
      },
    });
    if (!isValid) continue;
    downloadQueue.add(async () => {
      try {
        const info = await probe(url);
        await db.job.update({
          where: { id: jobId },
          data: {
            authorHandle: info.authorHandle,
            title: info.title,
            durationSec: info.durationSec,
            thumbnailUrl: info.thumbnailUrl,
          },
        });
        await runDownloadJob(jobId, url, info, {});
      } catch {
        // Orchestrator already handles failure state.
      }
    });
  }

  return { ok: true, batchId, jobIds };
}
```

- [ ] **Step 4: app/actions/cancel.ts**

```ts
"use server";

import { db } from "@/lib/db";

export async function cancelJob(jobId: string) {
  await db.job.update({
    where: { id: jobId },
    data: { status: "CANCELLED", finishedAt: new Date() },
  });
  return { ok: true };
}
```

(Note: v1 doesn't actually kill the spawned process — just marks as cancelled in DB. Process termination is post-v1 polish.)

- [ ] **Step 5: app/actions/history.ts**

```ts
"use server";

import { db } from "@/lib/db";

export async function listHistory(limit = 100) {
  return db.job.findMany({
    where: { status: "COMPLETED", deletedAt: null },
    orderBy: { finishedAt: "desc" },
    take: limit,
  });
}

export async function deleteJob(jobId: string) {
  await db.job.update({ where: { id: jobId }, data: { deletedAt: new Date() } });
  return { ok: true };
}

export async function getActiveJobs() {
  return db.job.findMany({
    where: { status: { in: ["VALIDATING", "DOWNLOADING", "PROCESSING"] }, finishedAt: null },
  });
}

export async function cancelStaleJobs() {
  await db.job.updateMany({
    where: { status: { in: ["VALIDATING", "DOWNLOADING", "PROCESSING"] }, finishedAt: null },
    data: { status: "CANCELLED", finishedAt: new Date() },
  });
}
```

- [ ] **Step 6: app/actions/config.ts**

```ts
"use server";

import { getSettings, setSetting, type AppSettings } from "@/lib/config";
import { setLogRawUrl } from "@/lib/logger";
import { checkAndUpdateYtdlp } from "@/lib/updater";

export async function readSettings() {
  return getSettings();
}

export async function writeSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  await setSetting(key, value);
  if (key === "logRawUrl") setLogRawUrl(Boolean(value));
  return { ok: true };
}

export async function checkUpdate() {
  return checkAndUpdateYtdlp(true);
}
```

- [ ] **Step 7: SSE route — app/api/progress/[jobId]/route.ts**

```ts
import type { NextRequest } from "next/server";
import { progressBus } from "@/lib/progress-bus";
import { db } from "@/lib/db";
import type { JobProgress } from "@/lib/downloader/types";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { jobId: string } }) {
  const { jobId } = params;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: JobProgress) => {
        controller.enqueue(`event: ${data.status === "COMPLETED" ? "done" : "progress"}\n`);
        controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
      };
      const handler = (p: JobProgress) => {
        send(p);
        if (p.status === "COMPLETED" || p.status === "FAILED" || p.status === "CANCELLED") {
          progressBus.off(jobId, handler);
          controller.close();
        }
      };
      progressBus.on(jobId, handler);
      const current = await db.job.findUnique({ where: { id: jobId } });
      if (current) {
        send({
          jobId,
          status: current.status as JobProgress["status"],
          percent: current.status === "COMPLETED" ? 100 : 0,
          message: current.errorMessage ?? undefined,
        });
        if (current.status === "COMPLETED" || current.status === "FAILED" || current.status === "CANCELLED") {
          progressBus.off(jobId, handler);
          controller.close();
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 8: Commit**

```powershell
git add app/actions/ app/api/
git commit -m "feat: Server Actions (probe/download/batch/cancel/history/config) + SSE"
```

---

## Milestone 5 — Shell + Primitives (Tasks 13-14)

### Task 13: Hand-rolled primitives (kbd, progress-bar, status-icon)

**Files:**
- Create: `components/primitives/kbd.tsx`, `components/primitives/progress-bar.tsx`, `components/primitives/status-icon.tsx`, `lib/cn.ts`

- [ ] **Step 1: lib/cn.ts utility**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: kbd.tsx**

```tsx
import { cn } from "@/lib/cn";

export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center",
        "h-5 min-w-[20px] px-1.5",
        "rounded-sm bg-surface border border-border",
        "font-mono text-xs text-text-subtle",
        "label-track",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
```

- [ ] **Step 3: progress-bar.tsx**

```tsx
import { cn } from "@/lib/cn";

type Variant = "default" | "success" | "danger";

const VARIANTS: Record<Variant, string> = {
  default: "bg-accent",
  success: "bg-success",
  danger: "bg-danger",
};

export function ProgressBar({ percent, variant = "default", showTicks = true, className }: {
  percent: number;
  variant?: Variant;
  showTicks?: boolean;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div className={cn("relative h-[2px] w-full bg-border overflow-hidden rounded-full", className)}>
      <div
        className={cn("absolute inset-y-0 left-0 transition-[width] duration-200 ease-out-quad", VARIANTS[variant])}
        style={{ width: `${clamped}%` }}
      />
      {showTicks && (
        <div className="absolute inset-0 flex justify-between pointer-events-none">
          {[25, 50, 75].map((t) => (
            <span key={t} className="block w-px bg-bg" style={{ marginLeft: `${t}%` }} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: status-icon.tsx**

```tsx
import { Loader2, CheckCircle2, AlertCircle, Clock, Eraser, Music2 } from "lucide-react";
import { cn } from "@/lib/cn";
import type { JobStatus } from "@/lib/downloader/types";

const CONFIG: Record<JobStatus, { Icon: typeof Loader2; color: string; spin: boolean }> = {
  PENDING: { Icon: Clock, color: "text-text-subtle", spin: false },
  VALIDATING: { Icon: Loader2, color: "text-text-muted", spin: true },
  DOWNLOADING: { Icon: Loader2, color: "text-accent", spin: true },
  PROCESSING: { Icon: Eraser, color: "text-accent", spin: false },
  COMPLETED: { Icon: CheckCircle2, color: "text-success", spin: false },
  FAILED: { Icon: AlertCircle, color: "text-danger", spin: false },
  CANCELLED: { Icon: AlertCircle, color: "text-text-subtle", spin: false },
};

export function StatusIcon({ status, size = 16 }: { status: JobStatus; size?: number }) {
  const { Icon, color, spin } = CONFIG[status];
  return <Icon size={size} className={cn(color, spin && "animate-spin")} aria-label={status} />;
}
```

- [ ] **Step 5: Commit**

```powershell
git add components/primitives/ lib/cn.ts
git commit -m "feat: hand-rolled primitives (kbd, progress-bar, status-icon)"
```

---

### Task 14: Shell layout + sidebar + auto-resume

**Files:**
- Create: `app/(main)/layout.tsx`, `components/shell/sidebar.tsx`, `components/shell/auto-resume-toast.tsx`

- [ ] **Step 1: Sidebar**

`components/shell/sidebar.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Download, Layers, History, Settings } from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { href: "/", Icon: Download, label: "Single" },
  { href: "/batch", Icon: Layers, label: "Batch" },
  { href: "/history", Icon: History, label: "Histórico" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-y-0 left-0 w-14 flex flex-col items-center bg-bg border-r border-border">
      <div className="h-14" />
      <ul className="flex flex-col gap-1 flex-1">
        {ITEMS.map(({ href, Icon, label }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                title={label}
                className={cn(
                  "group relative flex h-10 w-10 items-center justify-center rounded-md transition-colors",
                  active ? "text-text-primary" : "text-text-muted hover:text-text-primary"
                )}
              >
                {active && <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-text-primary" aria-hidden />}
                <Icon size={18} />
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href="/settings"
        title="Configurações"
        className={cn(
          "mb-3 flex h-10 w-10 items-center justify-center rounded-md transition-colors",
          pathname === "/settings" ? "text-text-primary" : "text-text-muted hover:text-text-primary"
        )}
      >
        <Settings size={18} />
      </Link>
    </nav>
  );
}
```

- [ ] **Step 2: Auto-resume toast**

`components/shell/auto-resume-toast.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { cancelStaleJobs, getActiveJobs } from "@/app/actions/history";

export function AutoResumeToast() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    getActiveJobs().then((jobs) => {
      if (jobs.length > 0) setCount(jobs.length);
    });
  }, []);
  useEffect(() => {
    if (count === null) return;
    const t = setTimeout(() => {
      cancelStaleJobs().then(() => setCount(null));
    }, 30000);
    return () => clearTimeout(t);
  }, [count]);
  if (!count) return null;
  return (
    <div className="fixed bottom-4 right-4 max-w-xs rounded-md border border-border bg-surface p-4 shadow-lg">
      <p className="text-sm text-text-primary">
        Você tinha {count} download{count > 1 ? "s" : ""} em andamento.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setCount(null)}
          className="h-8 rounded-md bg-accent border-b-2 border-accent-press px-3 text-xs font-medium text-white"
        >
          Retomar
        </button>
        <button
          onClick={() => cancelStaleJobs().then(() => setCount(null))}
          className="h-8 rounded-md border border-border px-3 text-xs text-text-muted hover:text-text-primary"
        >
          Marcar como cancelados
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: (main) layout**

`app/(main)/layout.tsx`:
```tsx
import { Sidebar } from "@/components/shell/sidebar";
import { AutoResumeToast } from "@/components/shell/auto-resume-toast";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <main className="pl-14">{children}</main>
      <AutoResumeToast />
    </div>
  );
}
```

- [ ] **Step 4: Smoke test**

```powershell
npm run dev
```
Visit http://localhost:3000 — expected: sidebar visible, no errors in console. (Page itself is still default Next page.)

- [ ] **Step 5: Commit**

```powershell
git add app/(main)/layout.tsx components/shell/
git commit -m "feat: shell layout + sidebar + auto-resume toast"
```

---

## Milestone 6 — Single mode UI (Tasks 15-17)

### Task 15: URL input + preview card

**Files:**
- Create: `components/single/url-input.tsx`, `components/single/preview-card.tsx`

- [ ] **Step 1: URL input**

`components/single/url-input.tsx`:
```tsx
"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Link as LinkIcon, Loader2 } from "lucide-react";
import { Kbd } from "@/components/primitives/kbd";
import { probeUrl } from "@/app/actions/probe";
import type { VideoInfo } from "@/lib/downloader/types";

type Props = {
  onProbed: (jobId: string, info: VideoInfo) => void;
  onError: (message: string) => void;
};

export function UrlInput({ onProbed, onError }: Props) {
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const submit = () => {
    if (!url.trim()) return;
    startTransition(async () => {
      const result = await probeUrl(url.trim());
      if (result.ok) onProbed(result.jobId, result.info);
      else onError(result.message);
    });
  };

  return (
    <div className="w-full max-w-2xl">
      <h1 className="text-xl font-medium text-text-primary">Cole um link do TikTok</h1>
      <p className="mt-1 text-sm text-text-muted font-mono">tiktok.com/@autor/video/...</p>
      <div className="mt-5 flex items-center gap-3 rounded-md border border-border bg-surface px-4 h-12 focus-within:border-accent transition-colors">
        {pending ? (
          <Loader2 size={16} className="text-text-muted animate-spin" />
        ) : (
          <LinkIcon size={16} className="text-text-subtle" />
        )}
        <input
          ref={ref}
          type="text"
          value={url}
          disabled={pending}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="https://..."
          className="flex-1 bg-transparent font-mono text-sm text-text-primary placeholder:text-text-subtle outline-none"
        />
        <Kbd>⌘V</Kbd>
      </div>
      {pending && (
        <p className="mt-3 text-sm text-text-muted">Verificando vídeo...</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Preview card**

`components/single/preview-card.tsx`:
```tsx
"use client";

import { ArrowRight, User, Clock, Video } from "lucide-react";
import { Kbd } from "@/components/primitives/kbd";
import type { VideoInfo } from "@/lib/downloader/types";

type Props = {
  info: VideoInfo;
  onDownload: () => void;
  onAudioOnly: () => void;
};

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function PreviewCard({ info, onDownload, onAudioOnly }: Props) {
  return (
    <div className="w-full max-w-2xl rounded-md border border-border bg-surface p-5">
      <div className="flex gap-4">
        {info.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={info.thumbnailUrl}
            alt=""
            className="h-[54px] w-[96px] rounded-sm object-cover border border-border"
          />
        ) : (
          <div className="h-[54px] w-[96px] rounded-sm bg-surface-hover border border-border" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm text-text-primary truncate">{info.authorHandle}</p>
          <p className="mt-1 text-sm text-text-muted line-clamp-2">{info.title}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-text-subtle font-mono">
            <span className="inline-flex items-center gap-1"><Clock size={12} />{formatDuration(info.durationSec)}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1"><Video size={12} />MP4</span>
          </div>
        </div>
      </div>
      <button
        onClick={onDownload}
        className="mt-5 w-full inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent border-b-2 border-accent-press text-sm font-medium text-white hover:brightness-110 transition"
      >
        Baixar vídeo
        <Kbd className="bg-white/10 border-white/20 text-white/80">↵</Kbd>
      </button>
      <button
        onClick={onAudioOnly}
        className="mt-3 w-full text-center text-sm text-text-muted hover:text-text-primary underline underline-offset-4 transition-colors"
      >
        ou só o áudio (MP3)
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```powershell
git add components/single/
git commit -m "feat: URL input + preview card components"
```

---

### Task 16: Progress card + Single page wiring

**Files:**
- Create: `components/single/progress-card.tsx`, `app/(main)/page.tsx`

- [ ] **Step 1: Progress card**

`components/single/progress-card.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { FolderOpen, RotateCcw } from "lucide-react";
import { ProgressBar } from "@/components/primitives/progress-bar";
import { StatusIcon } from "@/components/primitives/status-icon";
import type { JobStatus, VideoInfo } from "@/lib/downloader/types";

type Props = {
  jobId: string;
  info: VideoInfo;
  onRestart: () => void;
};

const STATUS_LABEL: Record<JobStatus, string> = {
  PENDING: "Na fila",
  VALIDATING: "Validando",
  DOWNLOADING: "Baixando",
  PROCESSING: "Processando",
  COMPLETED: "Pronto",
  FAILED: "Falhou",
  CANCELLED: "Cancelado",
};

export function ProgressCard({ jobId, info, onRestart }: Props) {
  const [status, setStatus] = useState<JobStatus>("DOWNLOADING");
  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState<string | undefined>();
  const [filePath, setFilePath] = useState<string | undefined>();

  useEffect(() => {
    const es = new EventSource(`/api/progress/${jobId}`);
    es.addEventListener("progress", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setStatus(data.status);
      setPercent(data.percent);
      setMessage(data.message);
    });
    es.addEventListener("done", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setStatus(data.status);
      setPercent(100);
      if (data.filePath) setFilePath(data.filePath);
      es.close();
    });
    es.onerror = () => es.close();
    return () => es.close();
  }, [jobId]);

  const variant = status === "COMPLETED" ? "success" : status === "FAILED" ? "danger" : "default";
  const displayMessage = message ?? STATUS_LABEL[status];

  return (
    <div className="w-full max-w-2xl rounded-md border border-border bg-surface p-5">
      <div className="flex gap-4">
        {info.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={info.thumbnailUrl} alt="" className="h-[54px] w-[96px] rounded-sm object-cover border border-border" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm text-text-primary truncate">{info.authorHandle}</p>
          <p className="mt-1 text-sm text-text-muted line-clamp-2">{info.title}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm">
        <StatusIcon status={status} size={16} />
        <span className="font-mono text-text-primary">
          {displayMessage}
          {status === "DOWNLOADING" && <span className="ml-2 text-text-muted">{percent.toFixed(0)}%</span>}
        </span>
      </div>
      <ProgressBar percent={percent} variant={variant} className="mt-3" />
      {status === "COMPLETED" && (
        <div className="mt-4 flex items-center gap-4 text-sm">
          {filePath && (
            <button
              onClick={() => fetch(`/api/open?path=${encodeURIComponent(filePath)}`, { method: "POST" })}
              className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
            >
              <FolderOpen size={14} /> Abrir pasta
            </button>
          )}
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-1.5 text-text-muted hover:text-text-primary transition-colors"
          >
            <RotateCcw size={14} /> Baixar outro
          </button>
        </div>
      )}
      {status === "FAILED" && (
        <div className="mt-4 flex items-center gap-4">
          <button onClick={onRestart} className="text-sm text-text-muted hover:text-text-primary underline underline-offset-4">
            Tentar de novo
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Single page**

`app/(main)/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { UrlInput } from "@/components/single/url-input";
import { PreviewCard } from "@/components/single/preview-card";
import { ProgressCard } from "@/components/single/progress-card";
import { startDownload } from "@/app/actions/download";
import type { VideoInfo } from "@/lib/downloader/types";

type Stage =
  | { kind: "input" }
  | { kind: "preview"; jobId: string; info: VideoInfo }
  | { kind: "progress"; jobId: string; info: VideoInfo }
  | { kind: "error"; message: string };

export default function SinglePage() {
  const [stage, setStage] = useState<Stage>({ kind: "input" });

  const reset = () => setStage({ kind: "input" });

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      {stage.kind === "input" && (
        <UrlInput
          onProbed={(jobId, info) => setStage({ kind: "preview", jobId, info })}
          onError={(message) => setStage({ kind: "error", message })}
        />
      )}
      {stage.kind === "preview" && (
        <PreviewCard
          info={stage.info}
          onDownload={() => {
            startDownload(stage.jobId, {});
            setStage({ kind: "progress", jobId: stage.jobId, info: stage.info });
          }}
          onAudioOnly={() => {
            startDownload(stage.jobId, { extractMp3: true });
            setStage({ kind: "progress", jobId: stage.jobId, info: stage.info });
          }}
        />
      )}
      {stage.kind === "progress" && (
        <ProgressCard jobId={stage.jobId} info={stage.info} onRestart={reset} />
      )}
      {stage.kind === "error" && (
        <div className="w-full max-w-2xl rounded-md border border-danger/30 bg-surface p-5">
          <p className="text-sm text-text-primary">{stage.message}</p>
          <button onClick={reset} className="mt-3 text-sm text-text-muted hover:text-text-primary underline underline-offset-4">
            Tentar outra URL
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Open folder API route**

`app/api/open/route.ts`:
```ts
import { spawn } from "node:child_process";
import { dirname } from "node:path";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");
  if (!path) return new Response("missing path", { status: 400 });
  spawn("explorer.exe", [dirname(path)], { detached: true, stdio: "ignore" }).unref();
  return new Response("ok");
}
```

- [ ] **Step 4: Smoke test**

```powershell
npm run dev
```
Visit http://localhost:3000.
- Paste a real public TikTok URL.
- Expected: input shows loading spinner → preview card appears with thumb/author/title → click "Baixar vídeo" → progress card with bar moving → ends in green checkmark with "Abrir pasta" / "Baixar outro" links.

If errors, fix before commit. Manual screenshot for verification.

- [ ] **Step 5: Commit**

```powershell
git add components/single/progress-card.tsx app/(main)/page.tsx app/api/open/
git commit -m "feat: progress card + Single mode page wired end-to-end"
```

---

## Milestone 7 — Batch + History + Settings (Tasks 17-19)

### Task 17: Batch page

**Files:**
- Create: `components/batch/url-list-input.tsx`, `components/batch/job-list.tsx`, `app/(main)/batch/page.tsx`

- [ ] **Step 1: URL list input**

`components/batch/url-list-input.tsx`:
```tsx
"use client";

import { useState } from "react";
import { parseUrlList } from "@/lib/downloader/url-validator";

type Props = { onSubmit: (text: string) => void; disabled?: boolean };

export function UrlListInput({ onSubmit, disabled }: Props) {
  const [text, setText] = useState("");
  const count = parseUrlList(text).length;
  return (
    <div className="w-full max-w-3xl">
      <h1 className="text-xl font-medium text-text-primary">Cole as URLs</h1>
      <p className="mt-1 text-sm text-text-muted">Uma por linha. Até 100 por vez.</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        rows={10}
        className="mt-5 w-full rounded-md border border-border bg-surface p-4 font-mono text-sm text-text-primary placeholder:text-text-subtle outline-none focus:border-accent transition-colors resize-y min-h-[200px]"
        placeholder="https://www.tiktok.com/..."
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-text-subtle font-mono">{count} URLs detectadas</span>
      </div>
      <button
        onClick={() => onSubmit(text)}
        disabled={disabled || count === 0}
        className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-accent border-b-2 border-accent-press px-6 text-sm font-medium text-white hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Iniciar fila
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Job list**

`components/batch/job-list.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { StatusIcon } from "@/components/primitives/status-icon";
import { ProgressBar } from "@/components/primitives/progress-bar";
import type { JobStatus } from "@/lib/downloader/types";

type JobRow = {
  id: string;
  authorHandle: string | null;
  title: string | null;
  status: JobStatus;
  errorMessage: string | null;
  fileSizeBytes: number | null;
  percent: number;
};

function fmtSize(b: number | null) {
  if (!b) return "";
  const mb = b / 1024 / 1024;
  return `${mb.toFixed(1)}MB`;
}

export function JobList({ jobIds }: { jobIds: string[] }) {
  const [jobs, setJobs] = useState<Record<string, JobRow>>({});

  useEffect(() => {
    const sources: EventSource[] = [];
    for (const id of jobIds) {
      const es = new EventSource(`/api/progress/${id}`);
      const update = (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        setJobs((prev) => ({
          ...prev,
          [id]: {
            id,
            authorHandle: prev[id]?.authorHandle ?? null,
            title: prev[id]?.title ?? null,
            status: data.status,
            errorMessage: data.message ?? null,
            fileSizeBytes: prev[id]?.fileSizeBytes ?? null,
            percent: data.percent ?? 0,
          },
        }));
      };
      es.addEventListener("progress", update);
      es.addEventListener("done", update);
      sources.push(es);
    }
    return () => sources.forEach((s) => s.close());
  }, [jobIds]);

  const arr = Object.values(jobs);
  const completed = arr.filter((j) => j.status === "COMPLETED").length;
  const failed = arr.filter((j) => j.status === "FAILED").length;
  const total = jobIds.length;
  const globalPct = total > 0 ? (arr.filter((j) => j.status === "COMPLETED" || j.status === "FAILED").length / total) * 100 : 0;

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-text-muted">
          {completed} / {total} concluídos · {failed} falhas
        </span>
      </div>
      <ProgressBar percent={globalPct} className="mb-6" />
      <ul className="space-y-2">
        {jobIds.map((id) => {
          const j = jobs[id];
          if (!j) {
            return (
              <li key={id} className="flex items-center gap-3 py-2">
                <StatusIcon status="PENDING" />
                <span className="font-mono text-xs text-text-subtle">{id.slice(0, 4)}</span>
                <span className="text-sm text-text-muted">na fila</span>
              </li>
            );
          }
          return (
            <li key={id} className="flex items-center gap-3 py-2">
              <StatusIcon status={j.status} />
              <span className="font-mono text-xs text-text-subtle">{id.slice(0, 4)}</span>
              <span className="font-mono text-sm text-text-primary min-w-[100px] truncate">{j.authorHandle ?? "..."}</span>
              <span className="flex-1 text-sm text-text-muted truncate">
                {j.status === "FAILED" ? (j.errorMessage ?? "falhou") : (j.title ?? "...")}
              </span>
              {j.status === "DOWNLOADING" && (
                <div className="w-24">
                  <ProgressBar percent={j.percent} showTicks={false} />
                </div>
              )}
              {j.status === "COMPLETED" && (
                <span className="font-mono text-xs text-text-subtle">{fmtSize(j.fileSizeBytes)}</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Batch page**

`app/(main)/batch/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { UrlListInput } from "@/components/batch/url-list-input";
import { JobList } from "@/components/batch/job-list";
import { startBatch } from "@/app/actions/batch";

export default function BatchPage() {
  const [jobIds, setJobIds] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-start justify-center p-6 pt-20">
      {!jobIds ? (
        <div className="w-full flex flex-col items-center">
          <UrlListInput
            onSubmit={async (text) => {
              const res = await startBatch(text);
              if (res.ok) setJobIds(res.jobIds);
              else setError(res.message);
            }}
          />
          {error && <p className="mt-4 text-sm text-danger">{error}</p>}
        </div>
      ) : (
        <JobList jobIds={jobIds} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```powershell
git add components/batch/ app/(main)/batch/
git commit -m "feat: Batch mode page (URL list + job list with SSE)"
```

---

### Task 18: History page + empty state

**Files:**
- Create: `components/history/empty-state.tsx`, `components/history/history-item.tsx`, `app/(main)/history/page.tsx`

- [ ] **Step 1: Empty state**

`components/history/empty-state.tsx`:
```tsx
import Link from "next/link";
import { Inbox } from "lucide-react";

export function HistoryEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <Inbox size={32} className="text-text-subtle" />
      <h2 className="mt-6 text-base font-medium text-text-primary">Nenhum download ainda</h2>
      <p className="mt-2 text-sm text-text-muted">Cole um link do TikTok pra começar</p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-md border border-border px-4 text-sm text-text-primary hover:bg-surface transition-colors"
      >
        Ir pra Single mode
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: History item**

`components/history/history-item.tsx`:
```tsx
"use client";

import { FolderOpen, RotateCcw, Trash2 } from "lucide-react";
import { deleteJob } from "@/app/actions/history";
import { useTransition } from "react";

type Item = {
  id: string;
  authorHandle: string | null;
  title: string | null;
  thumbnailUrl: string | null;
  fileSizeBytes: number | null;
  filePath: string | null;
  finishedAt: Date | null;
};

function relativeDate(d: Date | null) {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const h = diff / (1000 * 60 * 60);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}min atrás`;
  if (h < 24) return `${Math.floor(h)}h atrás`;
  if (h < 48) return "ontem";
  return new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

function fmtSize(b: number | null) {
  if (!b) return "—";
  return `${(b / 1024 / 1024).toFixed(1)}MB`;
}

export function HistoryItem({ item, onDelete }: { item: Item; onDelete: () => void }) {
  const [, startTransition] = useTransition();
  return (
    <li className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      {item.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.thumbnailUrl} alt="" className="h-9 w-16 rounded-sm object-cover border border-border" />
      ) : (
        <div className="h-9 w-16 rounded-sm bg-surface border border-border" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-sm text-text-primary truncate">{item.authorHandle ?? "—"}</p>
          <span className="font-mono text-xs text-text-subtle">{relativeDate(item.finishedAt)}</span>
        </div>
        <p className="mt-0.5 text-sm text-text-muted truncate">{item.title}</p>
        <p className="mt-0.5 font-mono text-xs text-text-subtle">
          {fmtSize(item.fileSizeBytes)} · {item.id.slice(0, 4)}
        </p>
      </div>
      <div className="flex items-center gap-1">
        {item.filePath && (
          <button
            onClick={() => fetch(`/api/open?path=${encodeURIComponent(item.filePath!)}`, { method: "POST" })}
            title="Abrir pasta"
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
          >
            <FolderOpen size={14} />
          </button>
        )}
        <button
          title="Re-baixar (em breve)"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-subtle"
          disabled
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={() => startTransition(() => deleteJob(item.id).then(onDelete))}
          title="Remover do histórico"
          className="h-8 w-8 inline-flex items-center justify-center rounded-md text-text-muted hover:text-danger hover:bg-surface transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
```

- [ ] **Step 3: History page**

`app/(main)/history/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { listHistory } from "@/app/actions/history";
import { HistoryEmptyState } from "@/components/history/empty-state";
import { HistoryItem } from "@/components/history/history-item";

type Job = Awaited<ReturnType<typeof listHistory>>[number];

export default function HistoryPage() {
  const [items, setItems] = useState<Job[] | null>(null);

  const refresh = () => listHistory().then(setItems);
  useEffect(() => { refresh(); }, []);

  if (items === null) return <div className="p-6 text-sm text-text-muted">Carregando...</div>;
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <HistoryEmptyState />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl p-6 pt-12">
      <h1 className="text-xl font-medium text-text-primary mb-6">Histórico</h1>
      <ul>
        {items.map((item) => (
          <HistoryItem key={item.id} item={item} onDelete={refresh} />
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```powershell
git add components/history/ app/(main)/history/
git commit -m "feat: History page with empty state + per-item actions"
```

---

### Task 19: Settings page

**Files:**
- Create: `components/settings/toggle-row.tsx`, `components/settings/folder-picker.tsx`, `components/settings/updater-row.tsx`, `app/(main)/settings/page.tsx`

- [ ] **Step 1: Toggle row**

`components/settings/toggle-row.tsx`:
```tsx
"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Props = {
  label: string;
  description: string;
  defaultChecked: boolean;
  onChange: (next: boolean) => Promise<void> | void;
};

export function ToggleRow({ label, description, defaultChecked, onChange }: Props) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <button
      type="button"
      onClick={() => {
        const next = !checked;
        setChecked(next);
        void onChange(next);
      }}
      className="flex w-full items-start gap-4 py-3 text-left"
    >
      <span
        className={cn(
          "mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-accent" : "bg-border",
        )}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-medium text-text-primary">{label}</span>
        <span className="mt-0.5 block text-sm text-text-muted">{description}</span>
      </span>
    </button>
  );
}
```

- [ ] **Step 2: Folder picker (read-only path display + button)**

`components/settings/folder-picker.tsx`:
```tsx
"use client";

import { FolderSearch } from "lucide-react";
import { useState } from "react";
import { writeSetting } from "@/app/actions/config";

export function FolderPicker({ initial }: { initial: string }) {
  const [path, setPath] = useState(initial);

  const choose = async () => {
    const next = window.prompt("Caminho da pasta de destino:", path);
    if (next && next.trim()) {
      setPath(next.trim());
      await writeSetting("downloadFolder", next.trim());
    }
  };

  return (
    <div className="flex items-center gap-3">
      <input
        readOnly
        value={path}
        className="flex-1 h-10 rounded-md border border-border bg-surface px-3 font-mono text-sm text-text-primary outline-none"
      />
      <button
        onClick={choose}
        className="h-10 inline-flex items-center gap-2 rounded-md border border-border px-3 text-sm text-text-primary hover:bg-surface transition-colors"
      >
        <FolderSearch size={14} />
        Escolher
      </button>
    </div>
  );
}
```

(Note: native folder picker requires a Tauri/Electron shell; v1 uses `window.prompt`. Future: build minimal Electron wrapper if user wants OS folder picker.)

- [ ] **Step 3: Updater row**

`components/settings/updater-row.tsx`:
```tsx
"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { checkUpdate } from "@/app/actions/config";

export function UpdaterRow({ version }: { version: string }) {
  const [current, setCurrent] = useState(version);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex items-center gap-6">
      <div className="flex-1 grid grid-cols-2 gap-2 text-sm">
        <span className="text-text-muted">Versão local</span>
        <span className="font-mono text-text-primary">{current}</span>
      </div>
      <button
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await checkUpdate();
            setCurrent(r.version);
            setMsg(r.updated ? `Atualizado para ${r.version}` : "Já está na última versão");
          })
        }
        className="h-10 inline-flex items-center gap-2 rounded-md border border-border px-3 text-sm text-text-primary hover:bg-surface transition-colors disabled:opacity-50"
      >
        <RefreshCw size={14} className={pending ? "animate-spin" : undefined} />
        Verificar atualização
      </button>
      {msg && <p className="text-xs text-text-muted">{msg}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Settings page**

`app/(main)/settings/page.tsx`:
```tsx
import { readSettings, writeSetting } from "@/app/actions/config";
import { ToggleRow } from "@/components/settings/toggle-row";
import { FolderPicker } from "@/components/settings/folder-picker";
import { UpdaterRow } from "@/components/settings/updater-row";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const s = await readSettings();
  const versionRow = await db.setting.findUnique({ where: { key: "ytdlpVersion" } });

  return (
    <div className="mx-auto max-w-2xl p-6 pt-12 space-y-10">
      <h1 className="text-xl font-medium text-text-primary">Configurações</h1>

      <section>
        <h2 className="text-base font-medium text-text-primary">Pasta de destino</h2>
        <p className="mt-1 text-sm text-text-muted">Onde os vídeos vão ser salvos.</p>
        <div className="mt-4">
          <FolderPicker initial={s.downloadFolder} />
        </div>
      </section>

      <section>
        <h2 className="text-base font-medium text-text-primary">Processamento</h2>
        <div className="mt-2 divide-y divide-border">
          <ToggleRow
            label="Remover metadados automaticamente"
            description="Limpa autor, GPS, encoder do arquivo final. Recomendado."
            defaultChecked={s.autoStripMetadata}
            onChange={(v) => writeSetting("autoStripMetadata", v)}
          />
          <ToggleRow
            label="Sempre gerar MP3 junto"
            description="Cria um .mp3 320kbps a cada download."
            defaultChecked={s.alwaysExtractMp3}
            onChange={(v) => writeSetting("alwaysExtractMp3", v)}
          />
        </div>
      </section>

      <section>
        <h2 className="text-base font-medium text-text-primary">Engine de download</h2>
        <div className="mt-4">
          <UpdaterRow version={versionRow?.value ?? "desconhecida"} />
        </div>
      </section>

      <section>
        <h2 className="text-base font-medium text-text-primary">Logs</h2>
        <div className="mt-2">
          <ToggleRow
            label="Logar URL completa"
            description="Por padrão, URLs são hasheadas pra privacidade. Ative só pra debugar."
            defaultChecked={s.logRawUrl}
            onChange={(v) => writeSetting("logRawUrl", v)}
          />
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```powershell
git add components/settings/ app/(main)/settings/
git commit -m "feat: Settings page (folder, toggles, updater, logs)"
```

---

## Milestone 8 — Validation (Tasks 20-21)

### Task 20: Reliability suite (15-URL smoke test)

**Files:**
- Create: `tests/reliability-suite.ts`

- [ ] **Step 1: Implement suite**

```ts
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { probeUrl } from "@/app/actions/probe";

type Expect = "success" | "private_or_deleted" | "geo_blocked" | "invalid_url";

const CASES: Array<{ name: string; url: string; expect: Expect }> = [
  { name: "1 - vídeo curto público", url: "PASTE_PUBLIC_SHORT_URL_HERE", expect: "success" },
  { name: "2 - vídeo longo público", url: "PASTE_PUBLIC_LONG_URL_HERE", expect: "success" },
  { name: "3 - vídeo com música popular", url: "PASTE_MUSIC_URL_HERE", expect: "success" },
  { name: "4 - vídeo sem música original", url: "PASTE_NO_MUSIC_URL_HERE", expect: "success" },
  { name: "5 - slideshow", url: "PASTE_SLIDESHOW_URL_HERE", expect: "success" },
  { name: "6 - conta verificada", url: "PASTE_VERIFIED_URL_HERE", expect: "success" },
  { name: "7 - handle com chars especiais", url: "PASTE_SPECIAL_HANDLE_URL_HERE", expect: "success" },
  { name: "8 - vídeo privado", url: "PASTE_PRIVATE_URL_HERE", expect: "private_or_deleted" },
  { name: "9 - vídeo deletado", url: "PASTE_DELETED_URL_HERE", expect: "private_or_deleted" },
  { name: "10 - URL curta vm.tiktok", url: "PASTE_VM_SHORT_URL_HERE", expect: "success" },
  { name: "11 - URL com query share", url: "PASTE_URL_WITH_QUERY_HERE", expect: "success" },
  { name: "12 - caption não-ASCII", url: "PASTE_NON_ASCII_URL_HERE", expect: "success" },
  { name: "13 - URL random tiktok.com", url: "https://www.tiktok.com/random", expect: "invalid_url" },
  { name: "14 - URL de outro site", url: "https://youtube.com/watch?v=abc", expect: "invalid_url" },
  { name: "15 - URL malformada", url: "tiktok/@user/video/123", expect: "invalid_url" },
];

async function main() {
  const results: Array<{ name: string; url: string; expected: Expect; got: string; pass: boolean }> = [];
  for (const c of CASES) {
    const r = await probeUrl(c.url);
    const got = r.ok ? "success" : r.errorCode;
    const pass = got === c.expect;
    results.push({ name: c.name, url: c.url, expected: c.expect, got, pass });
    console.log(`${pass ? "✓" : "✗"} ${c.name} — expected ${c.expect}, got ${got}`);
  }
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} passed`);
  mkdirSync(join(process.cwd(), "tests/runs"), { recursive: true });
  const file = join(process.cwd(), "tests/runs", `${Date.now()}.json`);
  writeFileSync(file, JSON.stringify({ ts: Date.now(), results }, null, 2));
  process.exit(passed >= 13 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
```

(Note: real URLs need to be filled in before first run. User will provide them in the validation phase.)

- [ ] **Step 2: Commit suite skeleton**

```powershell
git add tests/reliability-suite.ts
git commit -m "feat: reliability suite skeleton (URLs pending fill-in)"
```

---

### Task 21: Playwright e2e validation

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/single-flow.spec.ts`, `tests/e2e/settings-flow.spec.ts`

- [ ] **Step 1: Playwright config**

`playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    timeout: 120_000,
    reuseExistingServer: true,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
```

- [ ] **Step 2: Single flow spec**

`tests/e2e/single-flow.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("loads single page with URL input", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Cole um link do TikTok")).toBeVisible();
  await expect(page.getByText("tiktok.com/@autor/video/...")).toBeVisible();
});

test("shows error for invalid URL", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("https://...").fill("https://youtube.com/foo");
  await page.getByPlaceholder("https://...").press("Enter");
  await expect(page.getByText(/não parece ser do TikTok/i)).toBeVisible({ timeout: 10_000 });
});

test("sidebar navigation works", async ({ page }) => {
  await page.goto("/");
  await page.getByTitle("Batch").click();
  await expect(page).toHaveURL("/batch");
  await expect(page.getByText("Cole as URLs")).toBeVisible();
  await page.getByTitle("Histórico").click();
  await expect(page).toHaveURL("/history");
  await page.getByTitle("Configurações").click();
  await expect(page).toHaveURL("/settings");
  await expect(page.getByRole("heading", { name: "Configurações" })).toBeVisible();
});
```

- [ ] **Step 3: Settings flow spec**

`tests/e2e/settings-flow.spec.ts`:
```ts
import { test, expect } from "@playwright/test";

test("settings page renders all sections", async ({ page }) => {
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "Pasta de destino" })).toBeVisible();
  await expect(page.getByText("Remover metadados automaticamente")).toBeVisible();
  await expect(page.getByText("Sempre gerar MP3 junto")).toBeVisible();
  await expect(page.getByText("Engine de download")).toBeVisible();
});

test("toggling strip-metadata persists", async ({ page }) => {
  await page.goto("/settings");
  const toggle = page.getByRole("button", { name: /Remover metadados/i });
  const initial = await toggle.getAttribute("aria-pressed");
  await toggle.click();
  await page.reload();
  const next = await toggle.getAttribute("aria-pressed");
  expect(next).not.toBe(initial);
  // Reset.
  await toggle.click();
});
```

- [ ] **Step 4: Run Playwright**

```powershell
npm run test:e2e
```
Expected: all tests pass. (Real download flow tests omitted — they require a working public URL and are part of the reliability suite, not e2e.)

- [ ] **Step 5: Commit**

```powershell
git add playwright.config.ts tests/e2e/
git commit -m "test: Playwright e2e — pages render + nav + settings persistence"
```

---

## Self-review

**Spec coverage check:**
- §3 Stack → Task 1 (deps), Task 2 (Tailwind/Geist), Task 3 (Prisma)
- §4 Personality → Task 2 (tokens), Tasks 13-19 (consistent application)
- §5.1 Schema → Task 3
- §5.2 Pipeline → Task 10
- §5.3 Error categories → Task 4
- §5.4 Auto-update → Task 9
- §5.5 Queue + auto-resume → Task 11 (queue), Task 14 (auto-resume toast)
- §5.6 SSE → Task 12
- §6.1 Sidebar → Task 14
- §6.2 Single → Tasks 15, 16
- §6.3 Batch → Task 17
- §6.4 History + empty state → Task 18
- §6.5 Settings → Task 19
- §6.6 Microcopy → applied verbatim in component code
- §7 Reliability suite → Task 20
- §10 Acceptance → e2e covers UI; suite covers reliability; manual smoke in Task 16

**Placeholder scan:** Real URLs in Task 20 are `PASTE_*_URL_HERE` — flagged as user-provided input, not a plan placeholder. All code blocks have actual code.

**Type consistency:** `JobStatus`, `ErrorCode`, `VideoInfo`, `JobProgress`, `TaggedError` defined once in Task 4 and reused.

**Known limitation locked into plan (not a placeholder):**
- Folder picker uses `window.prompt` — native OS picker requires Tauri/Electron, post-v1.
- Cancel doesn't kill spawned process — DB-only flag, post-v1.

---

## Execution Handoff

Plano completo salvo em `docs/superpowers/plans/2026-05-27-tiktok-downloader-implementation.md`. 21 tasks, 8 milestones, ~80 commits planejados.

Duas opções de execução:

**1. Subagent-Driven (recomendado)** — Disparo um subagente fresco por task, reviso entre tasks, iteração rápida e contexto principal limpo.

**2. Inline Execution** — Executo tasks nesta mesma sessão usando `executing-plans`, batch com checkpoints pra review.

Qual abordagem?
