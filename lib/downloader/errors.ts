import type { TaggedError, ErrorCode } from "./types";

const PATTERNS: Array<{ regex: RegExp; code: ErrorCode; message: string }> = [
  {
    regex: /not.+available.+country|geo[\s-]?block|region[\s-]?lock/i,
    code: "geo_blocked",
    message: "Vídeo indisponível na sua região",
  },
  {
    regex: /private|unavailable|not.+available.+private|deleted|removed/i,
    code: "private_or_deleted",
    message: "Esse vídeo está privado ou foi removido",
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
      return {
        code,
        message,
        detail: stderr.trim().split("\n").slice(-3).join("\n"),
      };
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
