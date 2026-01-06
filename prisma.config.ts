// prisma.config.ts — Prisma v7.2.x (FINAL & CORRECT)

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
  },
});
