import { access, readFile } from 'node:fs/promises';

const candidates = name => [
  `supabase/migrations/${name}`,
  `supabase/migration-history/repository-only/${name}`,
  `supabase/migration-history/production-applied/${name}`,
];

export async function readSupabaseMigrationHistory(name) {
  for (const path of candidates(name)) {
    try {
      await access(path);
      return await readFile(path, 'utf8');
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  throw new Error(`Supabase migration history artifact not found: ${name}`);
}
