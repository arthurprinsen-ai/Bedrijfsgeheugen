import { readFile } from 'node:fs/promises';
import fs from 'node:fs';

export async function readMigrationHistory(name) {
  const active = new URL(`../../supabase/migrations/${name}`, import.meta.url);
  const archived = new URL(`../../supabase/migration-history/repository-only/${name}`, import.meta.url);
  try {
    return await readFile(active, 'utf8');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    return readFile(archived, 'utf8');
  }
}

export function readMigrationHistorySync(name) {
  const active = `supabase/migrations/${name}`;
  const archived = `supabase/migration-history/repository-only/${name}`;
  if (fs.existsSync(active)) return fs.readFileSync(active, 'utf8');
  if (fs.existsSync(archived)) return fs.readFileSync(archived, 'utf8');
  throw new Error(`MIGRATION_HISTORY_NOT_FOUND:${name}`);
}
