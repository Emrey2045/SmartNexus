// api/lib/prisma.js
// Prisma singleton: development'da hot-reload sırasında connection patlamasını önler.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__prisma__ ||
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__prisma__ = prisma;
}
