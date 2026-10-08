import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const safe = value => String(value ?? '').replace(/\x1b\[[0-9;]*m/g, '').replace(/[\r\n\t]+/g, ' ').replace(/\s+/g, ' ').replace(/%/g, '%25').slice(0, 420);

export function diagnosePreviewCheckRuns(payload) {
  const candidates = (Array.isArray(payload?.check_runs) ? payload.check_runs : [])
    .filter(check => check?.name === 'Supabase Preview' && check?.app?.slug === 'supabase')
    .sort((a, b) => (Number(b.id || 0) - Number(a.id || 0)) || String(b.started_at || '').localeCompare(String(a.started_at || '')));
  if (!candidates.length) return { code: 'PREVIEW_PROVIDER_MISSING', id: null, terminal: false, summary: 'No Supabase-owned preview check exists on this commit.' };
  const check = candidates[0];
  const id = String(check.id ?? 'unknown');
  if (check.status !== 'completed') return { code: 'PREVIEW_PROVIDER_PENDING', id, terminal: false, summary: 'Supabase preview is still running.' };
  if (check.conclusion === 'success') return { code: 'PREVIEW_PROVIDER_SUCCEEDED', id, terminal: true, summary: '' };
  const evidence = safe([check.output?.summary, check.output?.text].filter(Boolean).join(' '));
  let code = 'PREVIEW_PROVIDER_NON_SUCCESS';
  let remediation = 'Inspect the exact-head Supabase provider check; never treat a skipped or neutral check as success.';
  if (/SQLSTATE\s*42P01|relation\s+["']?[\w.]+["']?\s+does not exist/i.test(evidence)) {
    code = 'MIGRATION_MISSING_RELATION';
    remediation = 'Restore a versioned, dependency-ordered schema baseline before the first migration using the absent table; replay in an isolated preview.';
  } else if (/not associated with any Supabase Branch|not associated with.*Supabase.*Branch/i.test(evidence)) {
    code = 'PREVIEW_BRANCH_UNASSOCIATED';
    remediation = 'Restore the GitHub PR-to-Supabase Preview Branch association and rerun the provider-managed preview on the exact candidate HEAD.';
  } else if (/migration (?:history|versions?).*(?:mismatch|out.of.sync)|remote migration.*not found/i.test(evidence)) {
    code = 'MIGRATION_HISTORY_DRIFT';
    remediation = 'Reconcile repository migrations with the provider ledger; do not fabricate applied migration history.';
  } else if (/permission denied|unauthorized|forbidden|authentication failed/i.test(evidence)) {
    code = 'PREVIEW_PROVIDER_AUTHORIZATION';
    remediation = 'Repair the provider-side credentials or privileges; do not relax production RLS.';
  }
  return { code, id, terminal: true, conclusion: check.conclusion || 'unknown', summary: evidence, remediation, detailsUrl: check.details_url || '' };
}

function cli() {
  const path = process.argv[2];
  if (!path) throw new Error('Usage: node tools/ci/supabase-preview-diagnosis.mjs <check-runs.json>');
  const diagnosis = diagnosePreviewCheckRuns(JSON.parse(readFileSync(path, 'utf8')));
  // Machine-readable stdout is consumed only by the existing Required gate.
  // Diagnostics go to stderr and cannot accidentally become a passing state.
  const state = !diagnosis.terminal
    ? diagnosis.code === 'PREVIEW_PROVIDER_MISSING' ? 'missing' : `pending:${diagnosis.id}`
    : diagnosis.code === 'PREVIEW_PROVIDER_SUCCEEDED' ? `success:${diagnosis.id}` : `${diagnosis.conclusion}:${diagnosis.id}`;
  process.stdout.write(state);
  if (diagnosis.code === 'PREVIEW_PROVIDER_SUCCEEDED' || !diagnosis.terminal) return;
  console.error('::error title=Supabase Preview ' + diagnosis.code + '::' + safe(diagnosis.remediation + ' Provider conclusion: ' + diagnosis.conclusion + '. Evidence: ' + diagnosis.summary));
  console.error('SUPABASE_PREVIEW_ROOT_CAUSE=' + diagnosis.code + '; CHECK_ID=' + diagnosis.id);
  if (diagnosis.detailsUrl) console.error('SUPABASE_PREVIEW_PROVIDER_URL=' + diagnosis.detailsUrl);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) cli();
