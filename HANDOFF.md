# HANDOFF — TikTok Downloader

> **Otimizado pra Claude Opus 4.7 com effort `max`.** Esse modelo interpreta instruções literalmente, então tudo aqui é explícito. Front-load do intent + acceptance criteria; positive framing; paralelismo declarado; refs pra plano e memórias. (Best practices: [Anthropic announcement](https://www.anthropic.com/news/claude-opus-4-7) · [Opus 4.7 prompt guide](https://claudefa.st/blog/guide/development/opus-4-7-best-practices).)

Esse documento é o briefing completo pra outra sessão do Claude Code continuar o trabalho **autonomamente, sem perguntar nada ao usuário**. O usuário vai dormir e quer acordar com o app pronto e validado.

---

## LEITURA OBRIGATÓRIA antes de começar (Opus 4.7 max effort)

Pra você ter o mesmo contexto que eu (a sessão anterior) sobre como o Opus 4.7 com `max` se comporta e o que pediram aqui, **leia esses recursos antes de fazer qualquer coisa**. Use `WebFetch` (não precisa de auth) ou `WebSearch` se algum link mover:

1. **Anthropic — Introducing Claude Opus 4.7**
   `https://www.anthropic.com/news/claude-opus-4-7`
   Foco em: "Opus 4.7 thinks more at higher effort levels, particularly on later turns in agentic settings" + a recomendação de `xhigh`/`max` pra autonomous coding.

2. **Opus 4.7 prompt best practices**
   `https://claudefa.st/blog/guide/development/opus-4-7-best-practices`
   Foco em: front-loading intent, positive framing, paralelismo explícito, e como reescrever prompts antigos pra 4.7.

3. **Anthropic API docs — What's new in Claude 4.7**
   `https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7`
   Foco em: tokenizer mudou (input pode crescer 1.0–1.35x), thinking adaptativo, effort scale (`low`, `medium`, `high`, `xhigh`, `max`).

4. **O spec deste projeto**
   `docs/superpowers/specs/2026-05-27-tiktok-downloader-design.md`
   Decisões fechadas, paleta, microcopy verbatim.

5. **O plano deste projeto**
   `docs/superpowers/plans/2026-05-27-tiktok-downloader-implementation.md`
   21 tasks, código pronto pra colar, acceptance criteria por task.

6. **Memórias do usuário** (índice: `C:\Users\Walla\.claude\projects\C--Users-Walla\memory\MEMORY.md`)
   Leia pelo menos os 3 feedbacks de aesthetic: `feedback_no_emojis_use_icons.md`, `feedback_no_ai_aesthetic.md`, `feedback_premium_not_harsh.md`.

7. **Design system pack do usuário** (em `D:\Projetos\nossosmomentos\references\`)
   No mínimo: `refactoring-ui-master.md`. Os outros são opcionais conforme a task.

**Não economize tempo pulando essa leitura.** O usuário está dormindo e conta com você ter o mesmo contexto que a sessão anterior teve quando o spec foi escrito. Cinco minutos lendo poupa horas de retrabalho.

---

## OUTCOME (o que define sucesso)

Quando você terminar, o estado do projeto `D:\Projetos\tiktok-downloader` deve atender **todas** essas condições:

1. `npm install` já rodou sem erro (`node_modules/` existe)
2. `npm run bootstrap` baixou `bin/yt-dlp.exe`, `bin/ffmpeg.exe`, `bin/ffprobe.exe`
3. `npm test` retorna exit 0 com >=12 testes verdes (unit tests de errors, url-validator, ytdlp-parser, queue)
4. `npm run build` retorna exit 0 (zero erros de TS strict)
5. `npm run test:e2e` retorna exit 0 (Playwright e2e verde)
6. Dev server roda em `localhost:3000` sem erro de console
7. As 4 rotas (`/`, `/batch`, `/history`, `/settings`) renderizam todas
8. Screenshots em `validation/{rota}.png` salvos via Playwright MCP
9. `RESULTADO.md` na raiz documenta tudo + comandos pro usuário
10. Zero `git commit` feitos por você (apenas leitura)

Cada milestone abaixo tem acceptance criteria próprio que contribui pra esse outcome.

---

## Como começar (mensagem inicial pra colar no Claude Code)

Abra o Claude Code em `D:\Projetos\tiktok-downloader` no modo **bypass permissions** (`--dangerously-skip-permissions` ou via `/permissions` → bypassPermissions). Cole essa mensagem:

> Leia `HANDOFF.md` na raiz do projeto e execute tudo até o fim, sozinho, sem me perguntar nada. Não faça commits. Quando terminar, valide com Playwright e me deixa um relatório em `RESULTADO.md`. Marcha.

---

## Estado atual

**Working dir:** `D:\Projetos\tiktok-downloader`
**Git status:** repo iniciado em `main`, 3 commits feitos:
- `40393df` — chore: spec baseline + scaffolding inicial do repositorio
- `f0f12d2` — docs: plano de implementacao completo (21 tasks, 8 milestones)

**Arquivos commitados até aqui:** `.gitignore`, `README.md`, `docs/superpowers/specs/2026-05-27-tiktok-downloader-design.md`, `docs/superpowers/plans/2026-05-27-tiktok-downloader-implementation.md`.

**Código:** zero ainda. O projeto ainda não foi scaffoldeado com `create-next-app`. Tudo abaixo é trabalho a fazer.

---

## Regras de execução (em ordem de precedência)

> Framing positivo onde possível (4.7 segue melhor "faça X" do que "não faça Y").

1. **Git é read-only.** Use apenas `git status`, `git log`, `git diff`. **Nenhum** `git commit`/`git add`/`git push`. O usuário commita ele mesmo quando acordar.
2. **Use ícones de `lucide-react`** em qualquer elemento visual (status, navegação, botões, empty states). Nunca emojis em arquivo nenhum.
3. **Implemente exatamente o que o spec pede.** YAGNI rigoroso — se o spec não menciona, não construa.
4. **Decida e siga.** Resolva ambiguidades com decisões razoáveis e documente cada uma no `RESULTADO.md`. Só pare se for blocker irrecuperável (tente workaround primeiro).
5. **Acabamento opinionado tipo Linear/Vercel/Raycast.** Use radius `md` (6px), Geist Sans + Mono, paleta exata do spec §4, microcopy seco em PT-BR (texto verbatim em spec §6.6), uma única ação primária por contexto, hierarquia em grayscale antes de cor.
6. **Premium mas suave.** Cantos macios, transições com curva `out-quad` definida no Tailwind, hover states que respondem mas não exageram. Linha de corte: cantos NÃO mais afiados que `sm` (4px), borders sempre em `hsl(240 5% 14%)` ou mais sutis, sem `border-2` preto puro.

**Anti-patterns explícitos a evitar** (pra checagem rápida antes de mostrar trabalho como pronto):
- glassmorphism / `backdrop-blur` sem propósito funcional
- gradient blobs ou orbs de fundo
- hero centralizado genérico com 2 botões + subtitle cinza
- `shadow-xl` ou shadows pesados em cards
- shadcn defaults aplicados sem ajuste (radius default, button default)
- microcopy tipo "Welcome!", "Get Started", "Aw shucks!", "Looks empty here!"
- ícones em círculos coloridos (anti-pattern AI-cookbook)
- stat cards "99.9% uptime" estilo landing
- skeleton loaders parados sem propósito
- gradient roxo→rosa→azul em buttons

Essas regras vêm de feedback explícito do usuário durante o brainstorming. **Você pode (e deve) ler os seguintes recursos pra ter contexto completo:**

### Memórias persistentes do usuário (fonte primária)
Em `C:\Users\Walla\.claude\projects\C--Users-Walla\memory\` — leia o `MEMORY.md` primeiro (índice) e abra os memos relevantes:
- `feedback_no_emojis_use_icons.md` — usar lucide-react em vez de emojis
- `feedback_no_ai_aesthetic.md` — checklist anti-"cara de IA"
- `feedback_premium_not_harsh.md` — premium mas não áspero (alvo Linear/Vercel/Raycast)
- `reference_design_system_pack.md` — pointer pros manuais de design abaixo
- `user_language.md` — comunicação em PT-BR
- `project_pc_config.md` — config da máquina

### Design system pack (manuais opinionados — segunda fonte da verdade)
Em `D:\Projetos\nossosmomentos\references\` — o usuário considera essa pasta a fonte da verdade pra UI/código. Leia conforme a tarefa:
- `refactoring-ui-master.md` — **leia antes de qualquer UI nova.** Hierarchy, spacing, typography, color, depth, finishing touches.
- `refactoring-ui-process-personality.md` — feature-first, grayscale validation, personality tokens
- `refactoring-ui-visual-hierarchy.md` — emphasis, action hierarchy
- `refactoring-ui-layout-typography.md` — white space, density, scale, width
- `refactoring-ui-color-depth-images.md` — HSL reasoning, status colors, shadows
- `refactoring-ui-finishing-touches.md` — defaults, empty states, accent borders
- `frontend-craft-guardrails.md` — guardrails de Tailwind/shadcn/React com nuance (regras NÃO são absolutas)
- `react-next-architecture-operational-manual.md` — arquitetura Next 14
- `shadcn-ui-operational-manual.md` — uso de shadcn
- `tailwind-core-layout-operational-manual.md` · `tailwind-visual-interaction-operational-manual.md` — Tailwind opinionado
- `landing-page-master.md` — não relevante pra esse projeto, mas tem

### O que o usuário disse explicitamente nesta conversa (em PT-BR, ipsis verbis)

Pra você ter o tom e prioridades sem reler tudo:

1. **Sobre a ferramenta:** "quero que você faça para mim um baixador de videos do tiktok. quero baixa-los em alta qualidade e alta definição. sem precisar depender de ferramentas web que tem anuncios."
2. **Sobre interface:** escolheu **"App local em Next.js"** entre as opções single/PowerShell/menu-de-contexto
3. **Sobre uso:** escolheu **"Os dois (single + lote)"** entre single/batch/ambos
4. **Sobre features extras:** "**Extrair só áudio (MP3), removedor automatico de metadados implementado no site. um que funcione 100% pra videos**" — destaque pra MP3 + strip de metadados como features explícitas; "funcione 100%" é direcional sobre confiabilidade
5. **Sobre save path:** escolheu **"Pasta fixa configurável"** com subpastas por data
6. **Sobre ícones:** "**não quero que use emojis no site. mas sim icons, fica mais bonito**"
7. **Sobre referências de design:** "**eu esqueci que tinha esse claude md. vou te mandar um caminho de diretorio e vc leia, tem varias coisas boas, principalmente o refactoring ui: D:\Projetos\nossosmomentos**" — referenciou ativamente o design pack
8. **Sobre AI look:** "**leia tbm o refactoring ui de lá! pode prosseguir agora. mas eu não quero em nenhuma hipotese que tenha cara de ia. faça o seu melhor!**" — mandato anti-AI-look explícito
9. **Sobre dureza:** "**sim faça, mas não quero nada muito aspero e duro, lembre-se disso. continue!**" — premium mas suave (Linear, não Hyper)
10. **Sobre git:** "**faça isso então. faça um git no meu pc, quero deixar tudo salvo e bem documentado.**" — repo iniciado, mas commits seguintes só com pedido explícito
11. **Sobre execução:** "**use todo seu poder de fogo. agentes, skills, plugins. o que quiser. depois de tudo valide com o playwright. é isso. marcha!**" — autorização total pra autonomia + validação Playwright obrigatória
12. **Sobre commits:** "**não faça commit, somente quando eu pedir ok? irei dormir agora, então quero que você trabalhe sozinho. bora!**" — NÃO COMMITAR (regra mais importante do handoff)
13. **Sobre raciocínio:** "**coloquei raciocinio maximo, trabalhe sem pedir permissão! irei dormir! conto com você claude**" — max thinking, zero perguntas, autonomia plena

Essas mensagens são literalmente do usuário. Use elas como bússola quando o spec/plan deixar ambiguidade.

---

## Plataforma / ambiente

- **Windows 11 PowerShell.** Use PowerShell syntax: `Start-Process`/`Stop-Process` em vez de `&` background, `$env:VAR` em vez de `$VAR`, `$null` em vez de `/dev/null`.
- Se PowerShell bloquear scripts: `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` (rode preventivamente uma vez).
- **NÃO USE `cd`** em comandos Bash. Use `Set-Location` no PowerShell ou `WorkingDirectory` em `Start-Process`. O working dir do shell já está em `D:\Projetos\tiktok-downloader` quando você roda comando dali.
- Você TEM acesso ao Playwright MCP — use pra validar a UI no final.
- Node.js 20+ deve estar disponível. Se não estiver, abortar e reportar.

---

## O que executar

Siga o plano linha a linha:

**Arquivo do plano:** `docs/superpowers/plans/2026-05-27-tiktok-downloader-implementation.md`
**Arquivo do spec (referência):** `docs/superpowers/specs/2026-05-27-tiktok-downloader-design.md`

O plano tem 21 tasks distribuídas em 8 milestones. Execute na ordem, mas **PULE TODOS OS STEPS DE `git commit`** — o usuário commita depois.

### Milestones (visão rápida)

| # | Milestone | Tasks | Acceptance |
|---|---|---|---|
| M1 | Scaffolding (Next.js + Tailwind + Prisma) | 1, 2, 3 | dev server boota em `localhost:3000` |
| M2 | Core types + URL validator (TDD) | 4, 5 | `npm test` verde |
| M3 | Downloader engines (yt-dlp + ffmpeg + bootstrap) | 6, 7, 8, 9 | `./bin/yt-dlp.exe` e `ffmpeg.exe` baixados; parser tests passam |
| M4 | Orchestrator + Queue + Server Actions + SSE | 10, 11, 12 | queue tests passam; actions compilam |
| M5 | Primitives + Shell (sidebar + auto-resume) | 13, 14 | sidebar aparece em todas as rotas |
| M6 | Single mode UI | 15, 16 | fluxo single funcional com URL real |
| M7 | Batch + History + Settings | 17, 18, 19 | 4 telas renderizam com microcopy locked |
| M8 | Validation (suite + Playwright) | 20, 21 | `npm run test:e2e` verde |

### Estratégia recomendada (subagentes em paralelo onde possível)

Por causa do escopo, **use o `Agent` tool com `general-purpose` subagentes** pra paralelizar. Um subagente por milestone funciona bem porque:
- M1 deve terminar antes de qualquer outro (cria a fundação)
- M2 e M3 podem rodar em paralelo após M1 (não compartilham arquivos)
- M4 precisa de M2 e M3 prontos
- M5 pode rodar em paralelo com M4
- M6 precisa de M4 e M5 prontos
- M7 pode rodar em paralelo com M6 (telas independentes)
- M8 (validação) é o último, sequencial

Concretamente:
```
1. Execute M1 sozinho (sequencial)
2. Dispatch M2 e M3 em paralelo (uma mensagem com 2 Agent calls)
3. Dispatch M4 e M5 em paralelo
4. Dispatch M6 e M7 em paralelo
5. Execute M8 sozinho com Playwright MCP
```

Cada Agent prompt deve incluir:
- Working dir
- As 6 regras não-negociáveis acima
- As tasks específicas do milestone (copie do plan file)
- Acceptance criteria
- "NÃO COMMITAR"

---

## Decisões já tomadas no brainstorming (não revisitar)

| Decisão | Valor |
|---|---|
| Framework | Next.js 14 App Router |
| Linguagem | TypeScript strict + `noUncheckedIndexedAccess` |
| Estilo | Tailwind CSS com tokens custom (paleta no spec §4) |
| Componentes | shadcn/ui só pra primitives (Button, Input, Textarea, Toast) — o resto é hand-rolled |
| Ícones | lucide-react |
| Motion | Framer Motion (parcimônia) |
| Persistência | SQLite via Prisma (`prisma/dev.db`) |
| ID generator | `@paralleldrive/cuid2` (8 chars, UI mostra primeiros 4 como "shortId") |
| Download engine | yt-dlp.exe standalone em `./bin/` (baixado pelo bootstrap) |
| Processing engine | ffmpeg.exe + ffprobe.exe standalone em `./bin/` |
| Font | Geist Sans + Geist Mono (`geist` npm package) |
| Testes unitários | Vitest |
| Testes e2e | Playwright (chromium) |
| Save path default | `~/Videos/TikTok/{YYYY-MM-DD}/{author}_{jobId}.mp4` |
| Batch concurrency | 2 (hardcoded, não-configurável v1) |
| Batch limit | 100 URLs por fila |
| Idioma da UI | Português brasileiro |
| Microcopy completo | Locked no spec §6.6 — use **verbatim** |

---

## Personality tokens locked (NÃO mudar)

| Token | Valor | Implementação |
|---|---|---|
| vibe | utilitarian + premium | Linear/Vercel/Raycast |
| radius | `md` (6px) | `--radius: 6px` |
| font | mono-accent | Geist Sans (UI) + Geist Mono (URLs, IDs, paths, timestamps) |
| color-temperature | neutral | cinzas em `hsl(240 5% X%)` |
| density | balanced | `p-5` em cards, `gap-8` entre seções |

Paleta exata (em `tailwind.config.ts`):
```
bg:            hsl(0 0% 0%)
surface:       hsl(240 5% 6%)
surface-hover: hsl(240 5% 9%)
border:        hsl(240 5% 14%)
text-primary:  hsl(0 0% 95%)
text-muted:    hsl(240 5% 55%)
text-subtle:   hsl(240 5% 35%)
accent:        hsl(263 70% 58%)   ← só pra ação primária
accent-press:  hsl(263 70% 48%)
success:       hsl(150 60% 50%)
warning:       hsl(38 92% 55%)
danger:        hsl(0 70% 55%)
```

---

## Validação final (M8)

Depois de implementar M1 a M7, faça:

1. **Bootstrap dos binários:**
   ```powershell
   npm run bootstrap
   ```
   Verifique que `bin/yt-dlp.exe`, `bin/ffmpeg.exe`, `bin/ffprobe.exe` existem.

2. **Rodar testes unitários:**
   ```powershell
   npm test
   ```
   Esperado: tudo verde.

3. **Buildar:**
   ```powershell
   npm run build
   ```
   Esperado: build passa sem erro de tipo.

4. **Rodar Playwright e2e:**
   ```powershell
   npm run test:e2e
   ```
   Esperado: todos os specs passam.

5. **Validação visual com Playwright MCP:**
   - Suba dev server em background (`Start-Process npm -ArgumentList "run","dev" -PassThru ...`)
   - Wait até `localhost:3000` responder
   - Use o `mcp__playwright__browser_navigate` pra abrir cada rota (`/`, `/batch`, `/history`, `/settings`)
   - Use `mcp__playwright__browser_take_screenshot` pra capturar cada tela
   - Salve em `validation/{rota}.png`
   - Use `mcp__playwright__browser_snapshot` em cada rota pra ter o accessibility tree salvo em `validation/{rota}.snapshot.txt`
   - Mate o dev server no final

6. **Relatório final em `RESULTADO.md`:**
   - O que foi implementado (por milestone)
   - Output dos testes unitários
   - Output do Playwright
   - Lista dos screenshots salvos
   - Decisões autônomas que precisaram ser tomadas (e por quê)
   - Qualquer blocker ou pendência
   - Comandos pra o usuário rodar quando acordar (ex: `npm run bootstrap && npm run dev`)

---

## Tratamento de erros / blockers comuns

| Sintoma | Solução |
|---|---|
| `create-next-app` recusa scaffold em dir não-vazio | Scaffold em `D:\Projetos\tt-tmp`, mover arquivos preservando `.git/`, `.gitignore`, `README.md`, `docs/`, `HANDOFF.md` |
| PowerShell bloqueia script | Rodar `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| Bootstrap falha ao baixar ffmpeg (URL gyan.dev offline) | Tentar `https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-full.zip` ou `https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip`. Se ambos falham, marcar como pendência no `RESULTADO.md` e seguir (o app compila sem ffmpeg, só não consegue strippar metadata) |
| yt-dlp.exe não baixa | Tentar URL direta `https://github.com/yt-dlp/yt-dlp/releases/download/2026.05.20/yt-dlp.exe` (qualquer tag recente) |
| `npx prisma db push` falha | Verificar que `DATABASE_URL` não está conflitando com env. O `schema.prisma` define `file:./dev.db` inline, deve funcionar standalone |
| Playwright e2e timeout em `webServer.command` | Aumentar `timeout` no `playwright.config.ts` pra 180_000 |
| Build do Next reclama de tipos em Server Action | Verificar que toda Server Action começa com `"use server"` no topo do arquivo |
| `EventSource` não definido em Node | É browser API — só usar em componentes `"use client"` |

---

## O que NÃO fazer (mesmo se o plano mencionar)

- Não rodar a reliability suite com URLs reais (`tests/reliability-suite.ts`). As URLs são placeholder `PASTE_*_URL_HERE`. O usuário vai preencher e rodar quando acordar.
- Não criar conta em lugar nenhum.
- Não abrir browser pra screenshots fora do Playwright MCP.
- Não invocar nenhuma skill que peça aprovação interativa (brainstorming, etc).
- Não modificar `.gitignore`, `README.md`, `HANDOFF.md`, `docs/` — esses já estão commitados.

---

## Como o relatório `RESULTADO.md` deve ficar

Template sugerido:

```markdown
# Resultado da execução autônoma

**Sessão:** YYYY-MM-DD HH:MM
**Status geral:** [Tudo verde / Parcial / Blocker]

## Milestones

- [x/ ] M1 — Scaffolding
- [x/ ] M2 — Core types
- [x/ ] M3 — Engines
- [x/ ] M4 — Orchestrator
- [x/ ] M5 — Shell
- [x/ ] M6 — Single mode
- [x/ ] M7 — Batch + History + Settings
- [x/ ] M8 — Validation

## Comandos pra rodar agora

```powershell
cd D:\Projetos\tiktok-downloader
npm install              # se ainda não rodou
npm run bootstrap        # baixa yt-dlp + ffmpeg
npm run dev              # sobe em localhost:3000
```

## Output dos testes
[colar output de npm test]

## Output do Playwright
[colar output]

## Screenshots
- validation/single.png
- validation/batch.png
- validation/history.png
- validation/settings.png

## Decisões autônomas
- [lista de decisões que precisaram ser feitas sem o usuário]

## Pendências
- [lista do que faltou ou não consegui fazer]

## Diff a commitar
[git status output mostrando o que está pronto pra commit]
```

---

**Fim do handoff. Marcha.**
