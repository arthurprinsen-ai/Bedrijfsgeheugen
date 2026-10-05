import { readFile } from 'node:fs/promises';
import fs from 'node:fs';

export async function readMigrationHistory(name) {
  const candidates = [
    new URL(`../../supabase/migrations/${name}`, import.meta.url),
    new URL(`../../supabase/migration-history/production-applied/${name}`, import.meta.url),
    new URL(`../../supabase/migration-history/repository-only/${name}`, import.meta.url),
  ];
  for (const candidate of candidates) {
    try {
      return await readFile(candidate, 'utf8');
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  throw new Error(`MIGRATION_HISTORY_NOT_FOUND:${name}`);
}

export function readMigrationHistorySync(name) {
  const candidates = [
    `supabase/migrations/${name}`,
    `supabase/migration-history/production-applied/${name}`,
    `supabase/migration-history/repository-only/${name}`,
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return fs.readFileSync(candidate, 'utf8');
  }
  throw new Error(`MIGRATION_HISTORY_NOT_FOUND:${name}`);
}
