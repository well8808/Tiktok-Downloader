import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

// SEMPRE cacheia no globalThis (ver nota em progress-bus.ts). Como app de
// processo único (Electron), uma só conexão Prisma evita múltiplos clients
// apontando pro mesmo SQLite (risco de "database is locked").
globalForPrisma.prisma = db;
