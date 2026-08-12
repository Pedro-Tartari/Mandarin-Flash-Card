// src/config/env.ts
import 'dotenv/config';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const dbConfig = {
  port: Number(requireEnv('DB_PORT')),
  host: requireEnv('DB_HOST'),
  user: requireEnv('DB_USER'),
  password: requireEnv('DB_PASSWORD'),
  database: requireEnv('DB_NAME'),
} as const;