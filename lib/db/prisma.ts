/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";

const SCHEMA_VERSION = "2026-11-04-v12-partner-logo";
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  schemaVersion?: string;
};

// If cached prisma instance lacks new models or is from an earlier schema version, reset it
if (
  globalForPrisma.prisma &&
  (!(globalForPrisma.prisma as any).trainingComment ||
    !(globalForPrisma.prisma as any).researchComment ||
    !(globalForPrisma.prisma as any).projectMember ||
    !(globalForPrisma.prisma as any).hub ||
    !(globalForPrisma.prisma as any).opportunity ||
    !(globalForPrisma.prisma as any).resourceDocument ||
    !(globalForPrisma.prisma as any).guestRegistration ||
    !(globalForPrisma.prisma as any).guestEventConfig ||
    !(globalForPrisma.prisma as any).sponsor ||
    globalForPrisma.schemaVersion !== SCHEMA_VERSION)
) {
  try {
    (globalForPrisma.prisma as any).$disconnect();
  } catch {}
  globalForPrisma.prisma = undefined;
}

function createClient(): PrismaClient {
  try {
    if (typeof eval !== "undefined") {
      const dynamicReq = eval("require");
      for (const k of Object.keys(dynamicReq.cache)) {
        if (k.includes(".prisma") || k.includes("@prisma")) {
          delete dynamicReq.cache[k];
        }
      }
      const FreshClient = dynamicReq("@prisma/client").PrismaClient;
      return new FreshClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
      });
    }
  } catch {}
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma =
  globalForPrisma.prisma &&
  (globalForPrisma.prisma as any).hub &&
  (globalForPrisma.prisma as any).opportunity &&
  (globalForPrisma.prisma as any).resourceDocument &&
  (globalForPrisma.prisma as any).guestRegistration &&
  (globalForPrisma.prisma as any).guestEventConfig
    ? globalForPrisma.prisma
    : createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.schemaVersion = SCHEMA_VERSION;
}

export default prisma;
