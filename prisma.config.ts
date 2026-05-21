import { defineConfig, env } from "prisma/config";

try {
  await import("dotenv/config");
} catch {
  // dotenv unavailable in Docker — DATABASE_URL comes from env vars
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
