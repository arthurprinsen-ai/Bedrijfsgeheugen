import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const repo = process.env.GITHUB_REPOSITORY || '';
const token = process.env.GITHUB_TOKEN || '';
if (!repo || !token) throw new Error('GITHUB_REPOSITORY and GITHUB_TOKEN are required');

const cfg = JSON.parse(readFileSync('config/historical-terminal-reconciliation.json', 'utf8'));
if (cfg.contract !== 'POWERHOUSE-HISTORICAL-TERMINAL-RECONCILIATION-v1') {
  throw new Error('HISTORICAL_RECONCILIATION_CONTRACT_INVALID');
}
if (!Array.isArray(cfg.entries) || cfg.entries.length === 0) {
  throw new Error('HISTORICAL_RECONCILIATION_EMPTY');
}

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const governancePrefixes = ['docs/', '.agents/', 'tests/', '.github/', 'brain/learning/', 'brain/policies/', 'tools/delivery/'];
const governanceExact = new Set([
  'AGENTS.md',
  'config/delivery-prevention-rules.json',
  'config/powerhouse-agent-delivery-scheduler-v1.json',
  'platform/system-map/canonical-system-map.mjs',
  'tools/brain-delivery-system.mjs',
]);

function isGovernancePath(path) {
  return governanceExact.has(path) || governancePrefixes.some(prefix => path.startsWith(prefix));
}

function classify({ body, changedPaths }) {
  const nonGovernance = changedPaths.filter(path => !isGovernancePath(path));
  if (nonGovernance.length === 0) {
    return { readback_mode: 'non_runtime', non_governance_paths: [] };
  }

  const parityRecovery =
    /^Candidate-Type: recovery$/m.test(body) &&
    /^Obligation-ID: supabase-migration-history-parity-/m.test(body);

  if (parityRecovery) {
    const allowed = nonGovernance.every(path =>
      path.startsWith('supabase/migrations/') ||
      path === 'scripts/brain/check_powerhouse_supabase_security.py' ||
      path.startsWith('scripts/brain/quality/') ||
      path === 'config/powerhouse-quality-surface-contracts.json'
    );
    if (!allowed) {
      throw new Error('HISTORICAL_RECONCILIATION_UNEXPECTED_RUNTIME_PATH:' + nonGovernance.join(','));
    }
    return { readback_mode: 'supabase_history_parity_recovery', non_governance_paths: nonGovernance };
  }

  throw new Error('HISTORICAL_RECONCILIATION_RUNTIME_AUTHORITY_UNWIRED:' + nonGovernance.join(','));
}

async function fetchPullRequest(prNumber) {
  if (!Number.isInteger(prNumber) || prNumber < 1) {
    throw new Error('HISTORICAL_RECONCILIATION_PR_NUMBER_INVALID');
  }
  const endpoint = new URL('https://api.github.com/');
  endpoint.pathname = '/repos/' + repo + '/pulls/' + String(prNumber);
  const response = await fetch(endpoint, {
    headers: {
      Authorization: 'Bearer ' + token,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!response.ok) throw new Error('GITHUB_PULL_READ_FAILED:' + response.status + ':' + prNumber);
  return response.json();
}

git('fetch', 'origin', 'main', '--no-tags');
const currentMain = git('rev-parse', 'origin/main');
const evidence = [];

for (const entry of cfg.entries) {
  const prNumber = Number(entry.pr_number);
  if (!Number.isSafeInteger(prNumber) || prNumber < 1) {
    throw new Error('HISTORICAL_RECONCILIATION_PR_NUMBER_INVALID');
  }
  const pr = await fetchPullRequest(prNumber);
  if (!pr.merged_at || !pr.merge_commit_sha) throw new Error('HISTORICAL_PR_NOT_MERGED:' + prNumber);
  if (pr.merge_commit_sha !== entry.expected_merge_sha) {
    throw new Error('HISTORICAL_MERGE_SHA_DRIFT:' + prNumber + ':' + pr.merge_commit_sha);
  }
  if (!String(pr.body || '').includes('Writer-Lease-State: TERMINAL_DELIVERY')) {
    throw new Error('HISTORICAL_PR_NOT_TERMINAL_DELIVERY:' + prNumber);
  }
  if (!String(pr.body || '').includes('Obligation-ID: ' + entry.obligation_id)) {
    throw new Error('HISTORICAL_OBLIGATION_ID_DRIFT:' + prNumber);
  }

  git('fetch', 'origin', pr.merge_commit_sha, '--no-tags');
  execFileSync('git', ['merge-base', '--is-ancestor', pr.merge_commit_sha, currentMain]);
  const changedPaths = git('diff', '--name-only', pr.merge_commit_sha + '^1', pr.merge_commit_sha)
    .split(/\r?\n/)
    .filter(Boolean);

  const authority = classify({ body: String(pr.body || ''), changedPaths });
  evidence.push({
    contract: 'POWERHOUSE-GITHUB-DELIVERY-STATE-MACHINE-v1',
    evidence_version: 'historical-reconciliation-v1',
    terminal_status: 'LIVE_BEWEZEN',
    obligation_id: entry.obligation_id,
    pr_number: prNumber,
    candidate_head_sha: pr.head.sha,
    merge_sha: pr.merge_commit_sha,
    production_sha: currentMain,
    readback_mode: authority.readback_mode,
    supersedes_terminalizer_run_id: entry.supersedes_terminalizer_run_id,
    stale_readback_run_id: entry.stale_readback_run_id,
    stale_readback_authoritative: false,
    legacy_terminal_evidence_authoritative: false,
    checks: {
      merged_lineage_verified: true,
      main_contains_merge: true,
      production_readback_not_applicable: ['non_runtime', 'supabase_history_parity_recovery'].includes(authority.readback_mode),
      deploy_promotion_readback: false,
      runtime_function_readback: false,
      outcome_evidence: false,
      current_authority_reconciliation: true,
    },
    reconciled_at: new Date().toISOString(),
  });
}

mkdirSync('.artifacts', { recursive: true });
writeFileSync(
  '.artifacts/historical-terminal-reconciliation.json',
  JSON.stringify({ contract: cfg.contract, current_main_sha: currentMain, evidence }, null, 2) + '\n'
);
console.log(JSON.stringify({ state: 'HISTORICAL_TERMINAL_RECONCILIATION_COMPLETE', current_main_sha: currentMain, evidence }, null, 2));
