import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

function text(value) {
  return String(value ?? '').trim();
}

function sanitize(value) {
  return text(value)
    .replace(/(authorization\s*:\s*bearer\s+)[^\s,;]+/gi, '$1[redacted]')
    .replace(/\bbearer\s+[^\s,;]+/gi, 'bearer [redacted]')
    .replace(/\b(password|passwd|token|secret|api[_-]?key)\s*[=:]\s*([^\s,;]+)/gi, '$1=[redacted]')
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/`/g, "'")
    .replace(/\s+/g, ' ')
    .slice(0, 1000);
}

function marker(body, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = text(body).match(new RegExp(`^${escaped}:\\s*\\x60([^\\x60]+)\\x60`, 'mi'));
  return match?.[1]?.trim() ?? '';
}

export function reconcileLearningCandidate({ route, issues = [], headSha = '', runId = '', now = new Date().toISOString() }) {
  if (!route || typeof route !== 'object') throw new TypeError('route is required');
  const routeType = text(route.type);
  const fingerprint = text(route.fingerprint);
  if (!fingerprint) throw new TypeError('fingerprint is required');

  if (routeType === 'REUSE_PROVEN_LESSON') {
    return Object.freeze({ action: 'NONE', type: 'REUSE_PROVEN_LESSON', fingerprint, deduplicated: true });
  }
  if (!['LEARNING_CANDIDATE', 'REUSE_LEARNING_CANDIDATE'].includes(routeType)) {
    return Object.freeze({ action: 'NONE', type: routeType || 'IGNORED', fingerprint, deduplicated: false });
  }

  const candidateId = text(route.candidateId) || `learning-candidate|${fingerprint}`;
  const existingIssue = issues.find(issue => {
    const body = text(issue?.body);
    return marker(body, 'candidate_id') === candidateId || marker(body, 'fingerprint') === fingerprint;
  }) ?? null;

  const firstSeenSha = existingIssue ? marker(existingIssue.body, 'first_seen_sha') || text(route.headSha) || text(headSha) : text(route.headSha) || text(headSha);
  const firstSeenRun = existingIssue ? marker(existingIssue.body, 'first_seen_run') || text(route.evidenceRef).replace(/^github-run:/, '') || text(runId) : text(route.evidenceRef).replace(/^github-run:/, '') || text(runId);
  const lastSeenSha = text(route.headSha) || text(headSha);
  const lastSeenRun = text(route.evidenceRef).replace(/^github-run:/, '') || text(runId);
  const signature = sanitize(route.signature || 'Novel delivery failure; root cause not yet verified.');
  const evidenceRef = text(route.evidenceRef) || `github-run:${lastSeenRun}`;

  const body = [
    'status: `UNVERIFIED`',
    `candidate_id: \`${candidateId}\``,
    `fingerprint: \`${fingerprint}\``,
    `first_seen_sha: \`${firstSeenSha}\``,
    `first_seen_run: \`${firstSeenRun}\``,
    `last_seen_sha: \`${lastSeenSha}\``,
    `last_seen_run: \`${lastSeenRun}\``,
    `evidence_ref: \`${evidenceRef}\``,
    '',
    'signature:',
    signature,
    '',
    'This is a bounded BRAIN learning candidate. Root cause, fix and prevention remain UNVERIFIED until regression evidence promotes them through the canonical learning contract. No automatic promotion and no expensive AI/Make/Notion fan-out are permitted.',
  ].join('\n');

  const suffix = fingerprint.length > 110 ? `${fingerprint.slice(0, 107)}...` : fingerprint;
  return Object.freeze({
    action: existingIssue ? 'UPDATE' : 'CREATE',
    type: existingIssue ? 'REUSE_LEARNING_CANDIDATE' : 'LEARNING_CANDIDATE',
    status: 'UNVERIFIED',
    candidate_id: candidateId,
    fingerprint,
    issue_number: existingIssue?.number ?? null,
    title: `UNVERIFIED learning candidate: ${suffix}`,
    body,
    first_seen_sha: firstSeenSha,
    first_seen_run: firstSeenRun,
    last_seen_sha: lastSeenSha,
    last_seen_run: lastSeenRun,
    evidence_ref: evidenceRef,
    signature,
    deduplicated: Boolean(existingIssue),
    autoPromoteToProven: false,
    expensiveFanoutAllowed: false,
  });
}

async function main() {
  const [routePath, issuesPath, outputPath] = process.argv.slice(2);
  if (!routePath || !issuesPath || !outputPath) throw new Error('usage: delivery-learning-candidate-reconcile.mjs <route.json> <issues.json> <output.json>');
  const route = JSON.parse(await readFile(routePath, 'utf8'));
  const issuesDoc = JSON.parse(await readFile(issuesPath, 'utf8'));
  const issues = Array.isArray(issuesDoc) ? issuesDoc : (Array.isArray(issuesDoc.items) ? issuesDoc.items : []);
  const result = reconcileLearningCandidate({ route, issues, headSha: process.env.HEAD_SHA, runId: process.env.SOURCE_RUN_ID });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main().catch(error => {
    console.error(error?.stack || error);
    process.exit(1);
  });
}
