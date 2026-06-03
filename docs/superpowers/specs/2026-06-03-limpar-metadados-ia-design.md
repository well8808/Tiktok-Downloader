# Limpar metadados de vídeos de IA — Design

**Data:** 2026-06-03
**Status:** Aprovado

## Problema

Vídeos gerados por IA (Higgsfield, Kling 3.0, control motion) embutem metadados
de proveniência — tags de encoder/software e, principalmente, **credenciais
C2PA / Content Credentials** — que detectores de "feito por IA" leem. O app já
remove metadados no fluxo de download do TikTok (`stripMetadata`,
`autoStripMetadata` ligado por padrão), mas isso **só roda no download**. Os
vídeos de IA são arquivos **locais** no PC do usuário e não passam por esse
fluxo.

## Objetivo

Adicionar uma aba **"Limpar"** que recebe vídeos locais (arrastar ou seletor
nativo), remove **todos** os metadados via remux ffmpeg (sem reencodar) e salva
uma cópia limpa numa pasta dedicada, preservando os originais.

## Escopo (decisões do usuário)

- **Entrada:** seletor nativo do Windows (multi-seleção) + arrastar-e-soltar.
- **Saída:** pasta dedicada de "limpos" (mantém os originais).
- **Relatório:** nenhum before/after — só status por arquivo (limpando → pronto/erro).
- Só vídeo: `mp4, mov, m4v, webm, mkv, avi`. Saída no mesmo formato do original.
- Sem imagens, sem reencode.

## O que é removido (e o que não é)

- ✅ Tags de container e de stream: `encoder`, `handler_name`, autor, comentário,
  software, datas, GPS, `com.apple.quicktime.*`.
- ✅ Capítulos e metadados por faixa.
- ✅ **C2PA / Content Credentials** — descartado no remux, porque o ffmpeg
  reconstrói o container do zero e não copia as caixas `uuid`/`jumb` não-padrão.
- ✅ A assinatura do próprio ffmpeg no output (flags `bitexact`), pra não trocar
  um fingerprint por outro.
- ❌ Marca d'água invisível em pixels (ex.: SynthID) e logos visíveis — fora de
  escopo (não é metadado; exigiria reencodar/editar a imagem).

### Comando ffmpeg (lossless)

```
ffmpeg -y -i in \
  -map_metadata -1 -map_metadata:s -1 -map_chapters -1 \
  -fflags +bitexact -flags:v +bitexact -flags:a +bitexact \
  -movflags +faststart -c copy out
```

`-map_metadata:s -1` limpa metadados de todas as streams (vídeo e áudio) sem
depender de quais streams existem. `-c copy` = sem reencode (rápido, sem perda).
`+faststart` e flags de muxer só fazem efeito onde aplicável; são ignorados de
forma segura nos outros containers.

## Arquitetura

### Restrições do ambiente
- Electron 42, `contextIsolation: true`, `nodeIntegration: false`, **sem preload
  hoje**. `File.path` foi removido no Electron recente → drag-and-drop precisa de
  `webUtils.getPathForFile()`, que só existe via preload.
- Next.js roda in-process dentro do Electron; server actions/API têm acesso a
  Node (spawnam ffmpeg via `PATHS`). O renderer é uma página http normal.

### Componentes

1. **`electron/preload.js`** (novo) + `webPreferences.preload` no `main.js`:
   - `ipcMain.handle("dialog:selectVideos")` → `dialog.showOpenDialog`
     (`openFile` + `multiSelections`, filtro de vídeo) → retorna caminhos absolutos.
   - `contextBridge.exposeInMainWorld("desktop", { selectVideos, getPathForFile })`.
   - `getPathForFile(file)` usa `webUtils.getPathForFile(file)` pro drag-and-drop.
2. **`lib/downloader/ffmpeg.ts`** — nova função `stripMetadataDeep(in, out)` com o
   comando acima. `stripMetadata` (download) fica intacta.
3. **`app/actions/clean.ts`** (`"use server"`) — `cleanVideo(path)`: valida
   extensão, remuxa pra `PATHS.tmp`, move pra pasta de limpos com nome
   anti-colisão (`nome (1).mp4`), retorna `{ ok, outPath }` ou erro tagueado.
   Reusa `moveFile` (trata EXDEV cross-drive).
4. **`components/clean/clean-dropzone.tsx`** — dropzone + botão "Selecionar
   vídeos". Resolve caminhos via `window.desktop` (fallback `window.prompt` fora
   do Electron) e chama `cleanVideo` **um por arquivo em sequência**, atualizando
   a lista. Botão "Abrir pasta" via `/api/open`.
5. **`app/(main)/clean/page.tsx`** + `layout.tsx`; item **"Limpar"** (ícone
   `Eraser`) no `sidebar.tsx`.
6. **`lib/config.ts`** — setting `cleanFolder` (default `~/Videos/Limpos`),
   exposto em Configurações com o `FolderPicker` existente.

### Fluxo de dados

```
drop/seletor → window.desktop → caminhos absolutos
  → cleanVideo(path) [Node spawna ffmpeg] → PATHS.tmp → moveFile
  → pasta de limpos → UI marca "pronto"
```

### Tratamento de erro
Por arquivo, isolado: extensão inválida / ffmpeg falhou / arquivo sumiu → marca
o item como erro e segue os demais. Reusa `TaggedError` + `ffmpegError`.

## Verificação
- `tsc --noEmit` e `next build` sem erros.
- Teste manual: limpar um mp4 de IA → conferir com ffprobe que `format`/streams
  não têm tags e que não há caixa C2PA no output.
- Fallback de path funciona fora do Electron (não quebra `next dev`).
