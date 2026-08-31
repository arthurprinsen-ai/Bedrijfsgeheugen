import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const SHA40 = /^[a-f0-9]{40}$/i;

const SAFE_NON_SITE_PREFIXES = Object.freeze([
  '.github/',
  'brain/learning/',
  'docs/brain/',
  'docs/development-ledger-events/',
  'docs/learning/',
  'tests/',
]);

const SAFE_NON_SITE_FILES = Object.freeze(new Set([
  'AGENTS.md',
  'config/branch-delivery-ownership-guard.json',
  'config/browser-evidence-guard-contract.json',
  'config/chat-learning-completeness-guard.json',
  'config/delivery-prevention-rules.json',
  'config/guard-registry-schema-guard.json',
  'config/guard-regression-discovery-guard.json',
  'config/preflight-actionable-knowledge-guard.json',
]));

function isExplicitGovernanceOnly(path) {
  const normalized = String(path || '').trim().replaceAll('\\', '/');
  return SAFE_NON_SITE_FILES.has(normalized) || SAFE_NON_SITE_PREFIXES.some(prefix => normalized.startsWith(prefix));
}

export function evaluateNetlifyPreviewImpact({ context, cachedCommitRef, commitRef, changedPaths = [] } = {}) {
  const cached = String(cachedCommitRef || '').trim();
  const current = String(commitRef || '').trim();
  const paths = [...new Set(changedPaths.map(value => String(value || '').trim().replaceAll('\\', '/')).filter(Boolean))].sort();

  if (String(context || '').trim() !== 'deploy-preview') {
    return Object.freeze({ action: 'BUILD', exitCode: 1, reason: 'non_preview_context', changedPaths: Object.freeze(paths) });
  }
  if (!SHA40.test(cached) || !SHA40.test(current) || cached === current) {
    return Object.freeze({ action: 'BUILD', exitCode: 1, reason: 'invalid_or_equal_commit_refs', changedPaths: Object.freeze(paths) });
  }
  if (!paths.length) {
    return Object.freeze({ action: 'BUILD', exitCode: 1, reason: 'no_diff_evidence', changedPaths: Object.freeze(paths) });
  }
  if (!paths.every(isExplicitGovernanceOnly)) {
    return Object.freeze({ action: 'BUILD', exitCode: 1, reason: 'unknown_or_site_impact', changedPaths: Object.freeze(paths) });
  }
  return Object.freeze({ action: 'SKIP_PREVIEW', exitCode: 0, reason: 'proven_governance_only_diff', changedPaths: Object.freeze(paths) });
}

function readChangedPaths(cachedCommitRef, commitRef) {
  try {
    return execFileSync('git', ['diff', '--name-only', `${cachedCommitRef}..${commitRef}`], { encoding: 'utf8' })
      .split(/\r?\n/)
      .map(value => value.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
}

export function evaluateCurrentNetlifyBuild(env = process.env) {
  const cachedCommitRef = String(env.CACHED_COMMIT_REF || '').trim();
  const commitRef = String(env.COMMIT_REF || '').trim();
  const context = String(env.CONTEXT || '').trim();
  if (!SHA40.test(cachedCommitRef) || !SHA40.test(commitRef) || cachedCommitRef === commitRef) {
    return evaluateNetlifyPreviewImpact({ context, cachedCommitRef, commitRef, changedPaths: [] });
  }
  const changedPaths = readChangedPaths(cachedCommitRef, commitRef);
  if (!changedPaths) return Object.freeze({ action: 'BUILD', exitCode: 1, reason: 'git_diff_unavailable', changedPaths: Object.freeze([]) });
  return evaluateNetlifyPreviewImpact({ context, cachedCommitRef, commitRef, changedPaths });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = evaluateCurrentNetlifyBuild(process.env);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  process.exitCode = result.exitCode;
}
