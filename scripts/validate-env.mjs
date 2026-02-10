import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
];

const OPTIONAL_ENV_VARS = [
  "DIRECT_URL",
  "GEMINI_API_KEY",
  "R2_PUBLIC_URL",
];

function stripQuotes(value) {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function loadEnvFile(filename) {
  const filePath = resolve(process.cwd(), filename);
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const text = line.trim();
    if (!text || text.startsWith("#")) continue;

    const separatorIndex = text.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = text.slice(0, separatorIndex).trim();
    const value = stripQuotes(text.slice(separatorIndex + 1));

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name]);

if (missing.length > 0) {
  console.error("Build dibatalin: env production belum lengkap.");
  for (const name of missing) {
    console.error(`- Missing: ${name}`);
  }
  process.exit(1);
}

const authSecret = process.env.AUTH_SECRET || "";
if (authSecret.length < 32) {
  console.error("Build dibatalin: AUTH_SECRET minimal 32 karakter.");
  process.exit(1);
}

const dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl.startsWith("postgres://") && !dbUrl.startsWith("postgresql://")) {
  console.error("Build dibatalin: DATABASE_URL harus pakai schema postgres/postgresql.");
  process.exit(1);
}

for (const name of OPTIONAL_ENV_VARS) {
  if (!process.env[name]) {
    console.warn(`[warn] Env opsional belum diisi: ${name}`);
  }
}

console.log("Env check aman buat build production.");
