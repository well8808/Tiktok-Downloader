# TikTok Downloader — Design Spec

**Data:** 2026-05-27
**Status:** Draft pra review do usuário
**Próxima fase:** writing-plans (após aprovação)

---

## 1. Objetivo

Construir uma aplicação local (rodando em localhost) que baixe vídeos do TikTok em qualidade máxima (1080p sem watermark), com remoção automática de metadados, suportando download individual e em lote, sem dependência de ferramentas web com anúncios.

Single-user, single-machine, Windows 11. Não é SaaS, não tem auth, não tem multi-tenant.

## 2. Decisões fechadas (do brainstorming)

| Decisão | Valor |
|---|---|
| Interface | App local Next.js (rodando em `localhost:3000`) |
| Modo de uso | Single (uma URL por vez) + Batch (lista de URLs) |
| Features MVP | Download MP4, extração MP3, remoção automática de metadados |
| Save location | Pasta fixa configurável, organizada em subpastas por data |
| Linguagem da UI | Português brasileiro |
| Aesthetic | Premium-mas-não-áspero · ícones (sem emojis) · sem cara de IA |

## 3. Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Framework | Next.js 14 App Router | Stack default do usuário; Server Actions resolvem tudo sem API routes expostas |
| Linguagem | TypeScript strict | Default global do usuário |
| Estilo | Tailwind CSS + tokens custom | Default; tokens centralizados em `tailwind.config.ts` |
| Componentes | shadcn/ui (instalação seletiva) | Button, Input, Textarea, Dialog, Toast — só o necessário |
| Ícones | lucide-react | Default; cobre todos os casos planejados |
| Motion | Framer Motion | Usado com parcimônia (transições com propósito) |
| Persistência | SQLite via Prisma | Histórico, fila e config; zero infra externa |
| Engine download | yt-dlp.exe (binário standalone) | Estado da arte pra TikTok; usado em todas as ferramentas web sérias |
| Engine processing | ffmpeg.exe (binário standalone) | Strip metadata + conversão MP3 |
| Runtime | Node.js 20+ | Default |

**Bootstrap dos binários:** script `scripts/bootstrap.ps1` que baixa `yt-dlp.exe` e `ffmpeg.exe` em `./bin/` na primeira execução. Usuário não precisa instalar nada manualmente.

## 4. Personality tokens (locked)

Aplicando `refactoring-ui-process-personality.md`:

| Token | Valor | Implementação concreta |
|---|---|---|
| `vibe` | utilitarian + premium (não áspero) | Linear/Vercel/Raycast como referências |
| `radius` | `md` (6–8px) | `--radius: 6px` em `globals.css`; tokens `rounded-md` |
| `font` | mono-accent | Geist Sans (UI) + Geist Mono (URLs, IDs, paths, timestamps) |
| `color-temperature` | neutral | Cinzas levemente azulados (HSL com `h: 240 5%`) |
| `density` | balanced | Padding interno de cards `p-5`; espaçamento entre seções `gap-8` |

**Palette:**

```
--bg:            #000000          /* preto puro de fundo */
--surface:       hsl(240 5% 6%)   /* cards, sobre #000 */
--surface-hover: hsl(240 5% 9%)
--border:        hsl(240 5% 14%)
--text-primary:  hsl(0 0% 95%)
--text-muted:    hsl(240 5% 55%)
--text-subtle:   hsl(240 5% 35%)
--accent:        hsl(263 70% 58%)  /* roxo — APENAS na ação primária */
--accent-press:  hsl(263 70% 48%)  /* border-b do botão primário */
--success:       hsl(150 60% 50%)
--warning:       hsl(38 92% 55%)
--danger:        hsl(0 70% 55%)
```

**Tipografia (escala restrita, 3 níveis de texto + headings):**

```
--text-xs:  12px / mono /  tracking-wide / uppercase pra labels
--text-sm:  13px / sans /  body discreto
--text-md:  14px / sans /  body padrão
--text-lg:  16px / sans /  títulos de card
--text-xl:  20px / sans /  títulos de tela
```

Dois pesos: `font-normal` (400) e `font-medium` (500). Nunca `font-light`/`thin`.

## 5. Arquitetura

```
tiktok-downloader/
├── app/
│   ├── (main)/
│   │   ├── layout.tsx              # Shell com sidebar
│   │   ├── page.tsx                # Single mode (rota /)
│   │   ├── batch/page.tsx          # Batch mode
│   │   ├── history/page.tsx        # Histórico
│   │   └── settings/page.tsx       # Configurações
│   ├── actions/
│   │   ├── download.ts             # Server Actions: probe, download, cancel
│   │   ├── config.ts               # Server Actions: get/set settings
│   │   └── history.ts              # Server Actions: list, delete, re-download
│   ├── api/progress/[jobId]/route.ts  # SSE pra progresso em tempo real
│   └── globals.css                 # Tokens CSS
├── lib/
│   ├── downloader/
│   │   ├── ytdlp.ts                # Wrapper de yt-dlp (spawn, parse JSON)
│   │   ├── ffmpeg.ts               # Wrapper de ffmpeg (strip metadata, MP3)
│   │   ├── orchestrator.ts         # Pipeline atômico
│   │   ├── errors.ts               # Tipagem dos 7 erros + mapeamento
│   │   └── types.ts                # VideoInfo, JobState, etc
│   ├── queue.ts                    # Fila em memória pra batch (concorrência 2)
│   ├── db.ts                       # Prisma client
│   ├── config.ts                   # Leitura/escrita de settings
│   └── updater.ts                  # Auto-update do yt-dlp
├── components/
│   ├── shell/
│   │   ├── sidebar.tsx
│   │   └── topbar.tsx
│   ├── single/
│   │   ├── url-input.tsx
│   │   ├── preview-card.tsx
│   │   └── progress-card.tsx
│   ├── batch/
│   │   ├── url-list-input.tsx
│   │   └── job-list.tsx
│   ├── history/
│   │   └── history-item.tsx
│   ├── settings/
│   │   └── settings-form.tsx
│   └── ui/                         # shadcn primitives
├── prisma/
│   └── schema.prisma
├── bin/                            # binários baixados pelo bootstrap
│   ├── yt-dlp.exe
│   └── ffmpeg.exe
├── scripts/
│   └── bootstrap.ps1
├── tests/
│   └── reliability-suite.ts        # 15 URLs de validação
└── package.json
```

### 5.1 Schema do banco (Prisma)

```prisma
model Job {
  id            String    @id              // cuid curto (8 chars; UI exibe os 4 primeiros como "shortId")
  url           String                     // URL original
  authorHandle  String?                    // ex: "@joao"
  title         String?                    // descrição/caption do post
  durationSec   Int?
  thumbnailUrl  String?
  status        JobStatus @default(PENDING)
  errorCode     String?                    // 7 categorias tipadas
  errorMessage  String?
  filePath      String?                    // path final no destino
  audioPath     String?                    // se MP3 foi extraído
  fileSizeBytes Int?
  createdAt     DateTime  @default(now())
  startedAt     DateTime?
  finishedAt    DateTime?
  isBatch       Boolean   @default(false)
  batchId       String?                    // agrupa jobs de uma mesma fila
  deletedAt     DateTime?                  // soft delete (regra global)
}

enum JobStatus {
  PENDING
  VALIDATING
  DOWNLOADING
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

model Setting {
  key   String @id
  value String                              // JSON serializado
}
```

Settings esperados: `downloadFolder`, `autoStripMetadata`, `alwaysExtractMp3`, `ytdlpVersion`, `lastUpdateCheck`.

### 5.2 Pipeline de download (atômico)

```
1. validate URL (regex ^https?://(www\.|vm\.|m\.)?tiktok\.com/.+)
   ↓
2. yt-dlp --dump-json (probe sem baixar)
   ↓ retorna VideoInfo {id, author, title, duration, thumbnail, formats}
3. preview na UI → usuário confirma
   ↓
4. job criado no SQLite com status DOWNLOADING
   ↓
5. yt-dlp baixa pra ./.tmp/{jobId}.mp4
   --format "bv*+ba/b[ext=mp4]/best"
   --merge-output-format mp4
   --no-write-info-json
   --no-write-thumbnail
   ↓ retry chain se format primary falhar
6. ffmpeg strip metadata (stream copy, sem re-encode)
   ffmpeg -i .tmp/{jobId}.mp4 -map_metadata -1 -map_chapters -1 -c copy .tmp/{jobId}-clean.mp4
   ↓ status PROCESSING
7. ffprobe valida: container=mp4, duration>0, has video stream
   ↓
8. (opcional) extrai MP3: ffmpeg -i .tmp/{jobId}-clean.mp4 -vn -ab 320k -ar 44100 .tmp/{jobId}.mp3
   ↓
9. move pra {downloadFolder}/{YYYY-MM-DD}/{authorHandle}_{jobId}.mp4
   ↓ status COMPLETED
10. limpa .tmp/{jobId}*
```

Qualquer falha em qualquer passo: delete `.tmp/{jobId}*`, marca job `FAILED` com `errorCode` + `errorMessage`. Zero arquivo corrompido no destino.

### 5.3 Categorias de erro (tipadas)

| `errorCode` | Quando dispara | Mensagem mostrada |
|---|---|---|
| `private_or_deleted` | yt-dlp retorna "Video unavailable" ou similar | "Esse vídeo está privado ou foi removido" |
| `geo_blocked` | yt-dlp retorna "not available in your country" | "Vídeo indisponível na sua região" |
| `invalid_url` | Regex falha antes de tentar | "Esse link não parece ser do TikTok. Cole o link completo do post." |
| `rate_limited` | yt-dlp retorna 429 ou similar | "TikTok limitou as requisições. Aguarde 2 minutos e tente de novo." |
| `network` | Sem internet detectado | "Sem conexão com a internet" |
| `ytdlp_failed` | yt-dlp exit code != 0 (não categorizado) | "Erro ao baixar. Detalhes copiados pro clipboard. Tente atualizar o app." |
| `ffmpeg_failed` | ffmpeg exit code != 0 ou ffprobe inválido | "Erro ao processar o arquivo. Detalhes copiados pro clipboard." |

Mensagens nunca expõem stacktrace; o detalhe técnico vai pro clipboard quando relevante e pra log estruturado sempre.

### 5.4 Auto-update do yt-dlp

Ao iniciar o app (uma vez por dia, controlado por `lastUpdateCheck`):
1. Fetch `https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest`
2. Compara `tag_name` com `ytdlpVersion` salvo
3. Se diferente, baixa o novo `.exe` em `./bin/yt-dlp.exe.new`, valida tamanho > 5MB, faz swap atômico (renomeia old pra `.bak`, new pra `.exe`)
4. Atualiza `ytdlpVersion` no SQLite
5. Toast discreto: "yt-dlp atualizado pra 2026.05.20"

Botão manual em Settings dispara o mesmo fluxo.

### 5.5 Fila batch

- Limite: até 100 URLs por fila
- Concorrência: 2 jobs simultâneos (evita rate limit do TikTok); valor não é configurável na v1
- Jobs são persistidos no SQLite (status PENDING/DOWNLOADING/etc) — fila em memória apenas orquestra; estado real fica no banco
- Cada item da fila tem seu próprio jobId e SSE stream
- UI mostra: `12 / 23 concluídos · 2 falhas` no topo, lista de jobs abaixo

**Auto-resume:** ao iniciar o app, query SQLite por jobs com `status IN (VALIDATING, DOWNLOADING, PROCESSING)` e `finishedAt IS NULL`. Se houver, mostra toast: "Você tinha {n} downloads em andamento. Retomar?" com botões "Retomar" e "Marcar como cancelados". Sem ação do usuário em 30s, marca como `CANCELLED` automaticamente.

### 5.6 SSE de progresso

Rota `GET /api/progress/[jobId]` mantém conexão aberta, emite eventos:

```
event: status
data: {"status": "DOWNLOADING", "percent": 0}

event: progress
data: {"percent": 23}

event: status
data: {"status": "PROCESSING", "percent": 100}

event: status
data: {"status": "COMPLETED", "filePath": "..."}
```

`yt-dlp --progress` printa pra stdout linhas tipo `[download]  23.4% of 5.21MiB`; parser extrai `percent` e envia pelo SSE.

## 6. UI — telas e componentes

### 6.1 Shell

- Sidebar fixa à esquerda, 56px largura, fundo `--bg`
- 4 ícones empilhados verticalmente, tamanho 18px, `text-muted`
- Item ativo: `text-primary` + barra esquerda 2px branca (`border-l-2 border-white`)
- Item hover: `text-primary` (sem fundo)
- Tooltip ao hover (delay 600ms) com nome da tela

| Posição | Ícone (lucide) | Tooltip | Rota |
|---|---|---|---|
| 1 | `Download` | Single | `/` |
| 2 | `Layers` | Batch | `/batch` |
| 3 | `History` | Histórico | `/history` |
| 4 (rodapé) | `Settings` | Configurações | `/settings` |

### 6.2 Tela Single (`/`)

Layout: container `max-w-2xl mx-auto` centralizado verticalmente (`min-h-screen flex items-center`).

**Estado 1 — Vazio:**
```
   Cole um link do TikTok                ← text-xl, font-medium
   tiktok.com/@autor/video/...           ← text-sm, text-muted

   ┌─────────────────────────────────────────────┐
   │  ◯  https://...                       ⌘V   │  ← Input mono, h-12
   └─────────────────────────────────────────────┘
                                           ↑ pílula atalho text-subtle
```

**Estado 2 — URL colada, probando:**
- Input mostra ícone `Loader2` girando do lado esquerdo (no lugar do `Link`)
- Texto abaixo: "Verificando vídeo..." text-sm text-muted

**Estado 3 — Preview:**
```
   ┌─────────────────────────────────────────────┐
   │  ┌──────┐  @joao                            │
   │  │ thumb│  Caption do post truncada com... │
   │  │ 16:9 │  0:32 · 1080p · MP4              │
   │  └──────┘                                   │
   │                                             │
   │  [    Baixar vídeo               ↵    ]    │  ← botão primário roxo
   │       ou só o áudio (MP3)                  │  ← link cinza, text-sm
   └─────────────────────────────────────────────┘
```

- Card com `bg-surface`, `rounded-md`, `border border-[--border]`, `p-5`
- Thumb 96x54px (`object-cover`, `rounded-sm`)
- Metadata em `text-xs text-muted` com `·` como separador
- Botão primário: `bg-accent text-white`, `border-b-2 border-accent-press`, `h-11`, `rounded-md`, com atalho `↵` (Enter) à direita
- Link secundário: `text-sm text-muted underline-offset-4 hover:text-primary`

**Estado 4 — Baixando:**
- Card transforma em progress card (mesma posição, sem layout shift)
- Thumb permanence, autor permanence
- Barra de progresso `h-[2px] bg-border` com fill `bg-accent`
- Texto: "Baixando · 23%" em mono, text-sm
- Estado visual: ícone `Loader2` girando + label

**Estado 5 — Processando metadados:**
- Mesma estrutura, ícone vira `Eraser`, texto: "Removendo metadados"

**Estado 6 — Pronto:**
- Ícone `CheckCircle2` em `--success`
- Texto: "Pronto · 4.2 MB"
- Dois links secundários: "Abrir pasta" (lucide `FolderOpen`) e "Baixar outro" (`RotateCcw`)
- Barra de progresso permanece em 100% com cor `--success`

**Estado 7 — Falha:**
- Ícone `AlertCircle` em `--danger`
- Mensagem do erro tipado (item 5.3) em `text-sm text-primary`
- Link "Tentar de novo" embaixo

### 6.3 Tela Batch (`/batch`)

Layout: `max-w-3xl mx-auto`.

**Topo:**
```
   Cole as URLs                          ← text-xl, font-medium
   Uma por linha. Até 100 por vez.       ← text-sm, text-muted

   ┌─────────────────────────────────────────────┐
   │  https://tiktok.com/...                     │
   │  https://tiktok.com/...                     │  ← textarea mono
   │  https://tiktok.com/...                     │    min-h-[200px]
   │  |                                          │
   └─────────────────────────────────────────────┘
                              23 URLs detectadas  ← text-xs text-subtle
                                                   alinhado à direita

   [    Iniciar fila    ]                        ← botão primário
```

**Quando fila iniciada:**
```
   12 / 23 concluídos · 2 falhas                 ← text-sm text-muted
   [▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░] 52%                  ← barra h-[2px]

   ┌─────────────────────────────────────────────┐
   │ ✓ k3f9  @joao  caption...     4.2MB · 6s   │  ← row, gap-3
   │ ✓ p7m2  @maria caption...     2.1MB · 4s   │
   │ ↻ x9k4  @ana   caption...     [█████░] 60% │
   │ ↻ q2j8  @luis  caption...     [██░░░░] 30% │
   │ ⌛ y5r1  @paula caption...     na fila      │
   │ ✕ b8n3  @carlos privado                    │  ← falha com motivo
   └─────────────────────────────────────────────┘
```

- Sem borda em cada row, separação por espaçamento (`space-y-2`)
- ID do job (`k3f9`) em mono `text-xs text-subtle`
- Ícones de estado à esquerda do ID: `CheckCircle2` / `Loader2` (animado) / `Clock` / `AlertCircle`
- Metadata final à direita em mono

### 6.4 Tela Histórico (`/history`)

Lista vertical de jobs completados (status COMPLETED), ordenada por `finishedAt DESC`.

**Empty state (zero downloads):**
```
   ┌─────────────────────────────────────────────┐
   │                                             │
   │              ┌──┐                           │
   │              │📥│  ← ícone Inbox 32px text-subtle
   │              └──┘                           │
   │                                             │
   │     Nenhum download ainda                   │  ← text-md, font-medium
   │     Cole um link do TikTok pra começar      │  ← text-sm, text-muted
   │                                             │
   │     [    Ir pra Single mode    ]            │  ← botão secundário
   │                                             │
   └─────────────────────────────────────────────┘
```

(Empty state como onboarding, regra do refactoring-ui-finishing-touches.)

**Com itens:**
```
   ┌──────┐ @joao                       2h atrás  ↗ ↻ 🗑
   │ thumb│ caption do post truncada...
   └──────┘ 4.2MB · 1080p · k3f9
   ─────────────────────────────────────────────
   ┌──────┐ @maria                      ontem    ↗ ↻ 🗑
   │ thumb│ ...
   └──────┘ 2.1MB · 1080p · p7m2
```

- Thumb 64x36px, `rounded-sm`
- Ações à direita: `FolderOpen` (abrir pasta) · `RotateCcw` (re-baixar) · `Trash2` (soft delete)
- Divisor sutil entre items: `border-b border-[--border]`
- Timestamp em mono, relativo seco

### 6.5 Tela Settings (`/settings`)

Container `max-w-2xl`, seções com `space-y-8`.

**Seção 1: Pasta de destino**
```
   Pasta de destino                              ← text-md font-medium
   Onde os vídeos vão ser salvos.                ← text-sm text-muted

   ┌─────────────────────────────────────────┐
   │ C:\Users\Walla\Videos\TikTok            │ [Escolher]
   └─────────────────────────────────────────┘  ↑ botão secundário
   ↑ input em mono, read-only                     com ícone FolderSearch
```

**Seção 2: Processamento**
```
   Processamento                                 ← text-md font-medium

   ▓▓▓  Remover metadados automaticamente       ← toggle ativo
        Limpa autor, GPS, encoder do arquivo
        final. Recomendado.

   ░░░  Sempre gerar MP3 junto                  ← toggle inativo
        Cria um .mp3 320kbps a cada download.
```

**Seção 3: yt-dlp**
```
   Engine de download                            ← text-md font-medium

   Versão local      2026.05.20                 ← text-sm, mono
   Última checagem   há 2h
                                       [Verificar atualização]
                                          ↑ botão secundário
```

**Seção 4: Logs**
```
   Logs                                          ← text-md font-medium
   Registros estruturados de cada download.

   [Abrir pasta de logs]    [Logar URL completa] ← toggle
                                                   (off por padrão pra privacidade)
```

### 6.6 Microcopy completo (toda a app)

Locked aqui pra evitar drift na implementação:

| Contexto | Texto |
|---|---|
| Tela Single título | "Cole um link do TikTok" |
| Tela Single subtítulo | "tiktok.com/@autor/video/..." |
| Input placeholder | (sem placeholder — usar texto contextual acima do input) |
| Botão primário Single | "Baixar vídeo" |
| Link secundário Single | "ou só o áudio (MP3)" |
| Estado validando | "Verificando vídeo..." |
| Estado baixando | "Baixando · {percent}%" |
| Estado processando | "Removendo metadados" |
| Estado extraindo áudio | "Extraindo áudio" |
| Estado completo | "Pronto · {size}" |
| Link após completo 1 | "Abrir pasta" |
| Link após completo 2 | "Baixar outro" |
| Link após falha | "Tentar de novo" |
| Tela Batch título | "Cole as URLs" |
| Tela Batch subtítulo | "Uma por linha. Até 100 por vez." |
| Contador batch | "{n} URLs detectadas" |
| Botão batch primário | "Iniciar fila" |
| Progresso batch | "{n} / {total} concluídos · {failed} falhas" |
| Empty histórico título | "Nenhum download ainda" |
| Empty histórico corpo | "Cole um link do TikTok pra começar" |
| Empty histórico CTA | "Ir pra Single mode" |
| Settings pasta título | "Pasta de destino" |
| Settings pasta corpo | "Onde os vídeos vão ser salvos." |
| Settings processamento toggle 1 | "Remover metadados automaticamente" |
| Settings processamento corpo 1 | "Limpa autor, GPS, encoder do arquivo final. Recomendado." |
| Settings processamento toggle 2 | "Sempre gerar MP3 junto" |
| Settings processamento corpo 2 | "Cria um .mp3 320kbps a cada download." |
| Toast atualização | "yt-dlp atualizado pra {version}" |
| Toast auto-resume | "Você tinha {n} downloads em andamento. Retomar?" |

## 7. Confiabilidade — suite de validação

Antes de marcar a v1 pronta, rodar `tests/reliability-suite.ts` 3x em sequência. Critério: `>= 13 de 15` sucessos (ou erros esperados com mensagem correta).

| # | URL pattern | Resultado esperado |
|---|---|---|
| 1 | Vídeo curto público <15s | Download MP4 1080p sucesso |
| 2 | Vídeo longo público >2min | Download MP4 1080p sucesso |
| 3 | Vídeo com música popular (potencial copyright) | Download sucesso, áudio preservado |
| 4 | Vídeo sem música original | Download sucesso |
| 5 | Slideshow (TikTok photo post) | Download sucesso ou erro `unsupported_format` com mensagem clara |
| 6 | Conta verificada blue check | Download sucesso |
| 7 | Conta com chars especiais no handle | Download sucesso, filename sanitizado |
| 8 | Vídeo privado (link válido) | Erro `private_or_deleted` |
| 9 | Vídeo deletado (link válido) | Erro `private_or_deleted` |
| 10 | URL curta `vm.tiktok.com/XXX` | Download sucesso (yt-dlp resolve) |
| 11 | URL com `?_t=share` query | Download sucesso |
| 12 | Caracteres não-ASCII no caption | Download sucesso, filename sanitizado |
| 13 | URL inválida (`tiktok.com/random`) | Erro `invalid_url` antes de tentar |
| 14 | URL de outro site (`youtube.com/...`) | Erro `invalid_url` |
| 15 | URL malformada (`tiktok` sem `.com`) | Erro `invalid_url` |

Suite registra cada execução em `tests/runs/{timestamp}.json` pra acompanhar regressões.

## 8. Out of scope (NÃO fazer na v1)

- Login no TikTok (não necessário pra vídeos públicos)
- Download de vídeos privados via cookies
- Download de comentários ou perfis inteiros
- Conversão pra outros formatos além de MP4/MP3
- Edição/corte de vídeo
- Upload pra qualquer serviço
- Sincronização entre máquinas
- Multi-user / auth
- Tema claro (só dark)
- Tradução pra outros idiomas
- Histórico com busca/filtro (lista simples é suficiente pra v1)
- Notificações desktop nativas

## 9. Riscos conhecidos

1. **TikTok muda o protocolo de extração.** Mitigação: auto-update do yt-dlp (item 5.4) + check em background.
2. **ffmpeg não está disponível.** Mitigação: bootstrap baixa antes de qualquer download; falha do bootstrap mostra erro claro com link pra download manual.
3. **Disk space.** Mitigação: ffprobe valida antes de mover; em batch, pausa fila se livre < 500MB e avisa o usuário.
4. **Rate limit do TikTok em batch.** Mitigação: concorrência fixa em 2 + retry com backoff exponencial até 3x.
5. **Caracteres no filename quebram Windows.** Mitigação: sanitização strict (whitelist `a-z0-9_-`, autor truncado em 20 chars, fallback `tiktok_{jobId}`).

## 10. Critérios de aceitação da v1

- [ ] Bootstrap baixa yt-dlp + ffmpeg sem intervenção do usuário
- [ ] Single mode baixa 5 URLs públicas diferentes em sequência sem erro
- [ ] Batch processa 10 URLs com 2 concorrentes sem corromper nenhum arquivo
- [ ] Extração MP3 produz arquivo 320kbps válido
- [ ] Strip de metadata: `ffprobe` confirma `format.tags` vazio no arquivo final
- [ ] Cada uma das 7 categorias de erro mostra a mensagem correta com a URL correspondente
- [ ] UI passa pelo checklist anti-IA da [[feedback-no-ai-aesthetic]]
- [ ] UI passa pelo checklist premium-não-áspero da [[feedback-premium-not-harsh]]
- [ ] Suite de validação (15 URLs) passa em >= 13 em 3 execuções consecutivas
- [ ] Auto-update do yt-dlp funciona (testar com versão antiga)
- [ ] Histórico persiste entre restarts do app
- [ ] Settings persistem entre restarts

## 11. Próximas fases

Após aprovação deste spec:
1. `superpowers:writing-plans` cria o plano de implementação dividido em milestones
2. Execução por milestones com checkpoints de review
3. Cada milestone tem critério próprio de "done" derivado de §10
