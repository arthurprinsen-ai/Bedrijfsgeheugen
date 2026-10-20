import { appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const ISSUE_URL = 'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4447';

export function classifyNetlifyBridgeFailure({ http, error } = {}) {
  const status = String(http ?? '').trim();
  const code = String(error ?? '').trim().toLowerCase();
  if (status === '420' || code === 'composio_netlify_account_not_public') {
    return {
      failure_class: 'NETLIFY_AUTHORITY_NOT_VISIBLE',
      retryable: false,
      owner: 'Netlify/Composio integration administrator',
      next_action: 'Validate an ACTIVE Netlify account visible to the exact Composio project key used by the Supabase bridge; inspect Git-native CD. Do not publish private credentials.',
    };
  }
  if (status === '401' || code === 'oidc_auth_failed') {
    return {
      failure_class: 'GITHUB_OIDC_AUTHORIZATION_DENIED',
      retryable: false,
      owner: 'GitHub/Supabase deployment administrator',
      next_action: 'Validate authorized repository, ref, workflow_ref and OIDC audience; never bypass claim validation.',
    };
  }
  if (['431', '433', '434', '432', '421', '422', '423'].includes(status) || code.startsWith('composio_')) {
    return {
      failure_class: 'COMPOSIO_PROJECT_OR_SESSION_AUTHORITY',
      retryable: false,
      owner: 'Composio integration administrator',
      next_action: 'Inspect the project-scoped API key and connected-account/tool-router permissions. Re-authorize via approved team scope only.',
    };
  }
  if (code === 'vault_authority_unavailable') {
    return {
      failure_class: 'SUPABASE_VAULT_AUTHORITY_UNAVAILABLE',
      retryable: true,
      owner: 'Supabase operations',
      next_action: 'Inspect Vault and database health; retry only after authority is restored.',
    };
  }
  return {
    failure_class: 'NETLIFY_TRANSPORT_UNKNOWN',
    retryable: false,
    owner: 'Deployment on-call',
    next_action: 'Inspect provider and bridge logs, classify before any retry; preserve failed run and exact source identity.',
  };
}

export function buildNetlifyIncidentSummary({ http, error, sha, runUrl } = {}) {
  const failure = classifyNetlifyBridgeFailure({ http, error });
  const safeSha = /^[a-f0-9]{40}$/.test(String(sha || '')) ? sha : 'unverified';
  const safeRunUrl = /^https:\/\/github\.com\/arthurprinsen-ai\/Bedrijfsgeheugen\/actions\/runs\/\d+$/.test(String(runUrl || ''))
    ? runUrl : 'not supplied';
  return [
    '### Production Netlify transport: BLOCKED',
    '',
    '| Evidence | Value |',
    '| --- | --- |',
    `| Failure class | \`${failure.failure_class}\` |`,
    `| HTTP | \`${String(http ?? '').replace(/[^0-9]/g, '').slice(0, 3) || 'unknown'}\` |`,
    `| Exact source SHA | \`${safeSha}\` |`,
    `| Authorized retry | \`${failure.retryable}\` |`,
    `| Owner | ${failure.owner} |`,
    '',
    `Next action: ${failure.next_action}`,
    '',
    `Incident: ${ISSUE_URL}`,
    `GitHub run: ${safeRunUrl}`,
    '',
    '**Do not mark production green** until the exact published release and production behavior are independently read back.',
    '',
  ].join('\n');
}

const invokedAsScript = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) {
  const [http, error, sha, runUrl] = process.argv.slice(2);
  const failure = classifyNetlifyBridgeFailure({ http, error });
  console.error('NETLIFY_DEPLOY_FAILURE_CLASSIFIED ' + JSON.stringify({
    failure_class: failure.failure_class,
    retryable: failure.retryable,
    issue: ISSUE_URL,
  }));
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, buildNetlifyIncidentSummary({ http, error, sha, runUrl }));
  }
}
