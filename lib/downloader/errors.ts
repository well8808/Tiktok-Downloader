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

/**
 * Erro ao tentar SPAWNAR um executável (yt-dlp/ffmpeg). Distingue
 * ENOENT (binário ausente — tipicamente antivírus deletou/bloqueou)
 * de falha real de rede. Antes, qualquer erro de spawn virava
 * "Sem conexão com a internet", o que mascarava o problema real.
 */
export function spawnError(
  err: NodeJS.ErrnoException,
  exeName: string,
): TaggedError {
  if (err.code === "ENOENT") {
    return {
      code: "ytdlp_failed",
      message: `${exeName} não foi encontrado no app. Provável bloqueio do antivírus — adicione a pasta do app às exceções do Windows Defender e reinstale.`,
      detail: `ENOENT: ${err.path || exeName} não existe ou foi removido`,
    };
  }
  if (err.code === "EACCES" || err.code === "EPERM") {
    return {
      code: "ytdlp_failed",
      message: `Sem permissão pra executar ${exeName}. Provável bloqueio do antivírus.`,
      detail: `${err.code}: ${err.path || exeName}`,
    };
  }
  return {
    code: "network",
    message: "Sem conexão com a internet",
    detail: err.message,
  };
}
