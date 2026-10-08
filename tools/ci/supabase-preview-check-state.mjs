import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// This is an observer only: the Supabase-owned check is the sole preview authority.
// No local migration simulation may be substituted for an exact-HEAD provider success.
export function classifySupabasePreviewCheck(payload) {
  const checks = Array.isArray(payload?.check_runs) ? payload.check_runs : [];
  const checksFromSupabase = checks
    .filter(c => c?.name === 'Supabase Preview' && c?.app?.slug === 'supabase')
    .sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
  if (!checksFromSupabase.length) return { state: 'missing', code: 'PREVIEW_PROVIDER_CHECK_NOT_FOUND' };

  const check = checksFromSupabase[0];
  const id = String(check.id || 'unknown');
  if (check.status !== 'completed') return { state: `pending:${id}`, code: 'PREVIEW_PROVIDER_PENDING' };

  const conclusion = String(check.conclusion || 'unknown').toLowerCase();
  const evidence = [check.output?.title, check.output?.summary, check.output?.text].filter(Boolean).join('\n');
  const branchUnlinked = /not associated with any Supabase Branch|branch is not associated with (?:a|any) Supabase|no supabase branch/i.test(evidence);
  const migrationDependency = /SQLSTATE 42P01|relation [^\n]* does not exist/i.test(evidence);

  const code = conclusion === 'success'
    ? 'PREVIEW_PROVIDER_SUCCESS'
    : conclusion === 'skipped' && branchUnlinked
      ? 'SUPABASE_PREVIEW_BRANCH_NOT_ASSOCIATED'
      : migrationDependency
        ? 'SUPABASE_PREVIEW_MIGRATION_DEPENDENCY'
        : `SUPABASE_PREVIEW_${conclusion.toUpperCase().replace(/[^A-Z_]/g, '_')}`;

  return { state: `${conclusion}:${id}`, code, id };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const file = process.argv[2];
  if (!file) {
    console.error('::error::SUPABASE_PREVIEW_CHECK_INPUT_REQUIRED');
    process.exit(2);
  }
  const classification = classifySupabasePreviewCheck(JSON.parse(readFileSync(file, 'utf8')));
  if (classification.code === 'SUPABASE_PREVIEW_BRANCH_NOT_ASSOCIATED') {
    console.error('::error title=Supabase Preview branch not associated::PR Git branch has no provider-managed Supabase preview. Reconnect the exact PR branch using the Supabase GitHub integration and require a new provider-owned success check; retries of GitHub Required cannot repair this configuration.');
  } else if (classification.code === 'SUPABASE_PREVIEW_MIGRATION_DEPENDENCY') {
    console.error('::error title=Supabase migration replay dependency::Hosted preview could not replay migrations. Reconstruct prerequisite DDL in an ordered repository migration, test on a fresh provider preview, and never treat the populated production schema as a substitute.');
  }
  process.stdout.write(classification.state);
}
