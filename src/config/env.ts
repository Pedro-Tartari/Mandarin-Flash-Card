// src/config/env.ts
import "dotenv/config";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function requireEnvNumber(key: string): number {
  const raw = requireEnv(key);
  const value = Number(raw);
  if (Number.isNaN(value)) {
    throw new Error(
      `Environment variable ${key} must be a valid number, got "${raw}"`,
    );
  }
  return value;
}

export const dbConfig = {
  port: requireEnvNumber("DB_PORT"),
  host: requireEnv("DB_HOST"),
  user: requireEnv("DB_USER"),
  password: requireEnv("DB_PASSWORD"),
  database: requireEnv("DB_NAME"),
} as const;

export const serverConfig = {
  port: requireEnvNumber("PORT"),
} as const;
