/**
 * Preload — ponte segura renderer ↔ main com contextIsolation ligado.
 *
 * Expõe `window.desktop` pro app web (Next.js dentro do Electron):
 * - selectVideos(): abre o seletor nativo de arquivos (multi-seleção) e
 *   devolve os caminhos absolutos escolhidos.
 * - getPathForFile(file): resolve o caminho absoluto de um File arrastado
 *   pra dentro da janela. No Electron 32+ `File.path` foi removido, então
 *   esse é o único caminho confiável pra drag-and-drop.
 */
const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  selectVideos: () => ipcRenderer.invoke("dialog:selectVideos"),
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return "";
    }
  },
});
