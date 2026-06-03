export {};

declare global {
  interface Window {
    /**
     * Ponte exposta pelo preload do Electron (electron/preload.js).
     * Ausente quando o app web roda fora do Electron (ex.: `next dev`
     * no browser) — sempre cheque antes de usar.
     */
    desktop?: {
      /** Abre o seletor nativo (multi-seleção). Caminhos absolutos; [] se cancelar. */
      selectVideos: () => Promise<string[]>;
      /** Resolve o caminho absoluto de um File arrastado pra dentro da janela. */
      getPathForFile: (file: File) => string;
    };
  }
}
