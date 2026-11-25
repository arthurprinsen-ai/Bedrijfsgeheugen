#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
const validSha = v => /^[0-9a-f]{40}$/i.test(v || '');
const sourceId = v => v == null || v === -1 ? null : String(v);
export function reconcile(expected, observed, sha) {
  if (!validSha(sha) || !Array.isArray(expected) || !expected.length || !Array.isArray(observed))
    return { state: 'UNKNOWN', reason: 'INCOMPLETE_EVIDENCE', sha };
  const result = { state: 'PASS', sha, missing: [], wrongSource: [], ambiguous: [], incomplete: [], evidence: [] };
  for (const req of expected) {
    if (!req.context) { result.incomplete.push('REQUIRED_CONTEXT_UNSPECIFIED'); continue; }
    const matches = observed.filter(c => c.name === req.context && c.sha === sha);
    if (!matches.length) { result.missing.push(req.context); continue; }
    const source = sourceId(req.integration_id);
    const allowed = source ? matches.filter(c => sourceId(c.app_id) === source) : matches;
    if (!allowed.length) { result.wrongSource.push(req.context); continue; }
    if (!source && new Set(allowed.map(c => sourceId(c.app_id))).size > 1) result.ambiguous.push(req.context);
    const latest = [...allowed].sort((a, b) =>
      Date.parse(a.started_at || a.completed_at || 0) - Date.parse(b.started_at || b.completed_at || 0) ||
      Number(a.id || 0) - Number(b.id || 0)).at(-1);
    if (latest.conclusion !== 'success') result.incomplete.push(req.context);
    result.evidence.push({ context: req.context, app_id: latest.app_id ?? null,
      conclusion: latest.conclusion, url: latest.url || null, sha });
  }
  if ([result.missing, result.wrongSource, result.ambiguous, result.incomplete].some(x => x.length))
    result.state = 'BLOCKED_CONFIG_OR_CHECK';
  return result;
}
export function effectiveRequirements(protection, rules) {
  const result = [];
  if (protection) {
    for (const c of protection.checks || [])
      result.push({ context: c.context, integration_id: c.app_id, origin: 'branch_protection' });
    for (const context of protection.contexts || [])
      if (!result.some(x => x.context === context))
        result.push({ context, integration_id: null, origin: 'branch_protection' });
  }
  for (const rule of rules || []) if (rule.type === 'required_status_checks')
    for (const c of rule.parameters?.required_status_checks || [])
      result.push({ context: c.context, integration_id: c.integration_id, origin: 'effective_ruleset' });
  return result;
}
function gh(endpoint) {
  return JSON.parse(execFileSync('gh', ['api', '-H', 'Accept: application/vnd.github+json', endpoint],
    { encoding: 'utf8', timeout: 20000 }));
}
function read(endpoint, errors, optional = false) {
  try { return gh(endpoint); }
  catch (e) { if (!optional) errors.push({ endpoint, message: String(e.stderr || e.message || e).slice(0, 500) }); return null; }
}
export function classifyRemediation(diagnostic) {
  if (diagnostic.state === 'PASS') return 'NONE';
  if (diagnostic.state === 'UNKNOWN' || diagnostic.wrongSource?.length || diagnostic.ambiguous?.length)
    return 'ADMIN_OR_PERMISSION_REVIEW';
  if (diagnostic.missing?.length) return 'CHECK_WORKFLOW_TRIGGER_AND_SHA';
  if (diagnostic.incomplete?.length) return 'INSPECT_RUN_AND_RERUN_FAILED_JOBS_IF_SAME_SHA';
  return 'MANUAL_REVIEW';
}
export function inspect(repo, branch, sha, api = read) {
  const errors = [];
  const encoded = encodeURIComponent(branch);
  const rules = api(`repos/${repo}/rules/branches/${encoded}?per_page=100`, errors);
  const protection = api(`repos/${repo}/branches/${encoded}/protection/required_status_checks`, errors, true);
  const checks = api(`repos/${repo}/commits/${sha}/check-runs?per_page=100`, errors);
  const statuses = api(`repos/${repo}/commits/${sha}/statuses?per_page=100`, errors);
  const expected = effectiveRequirements(protection, rules);
  const observed = [
    ...(checks?.check_runs || []).map(c => ({ id: c.id, name: c.name, sha: c.head_sha,
      app_id: c.app?.id, conclusion: c.status === 'completed' ? c.conclusion : null,
      started_at: c.started_at, completed_at: c.completed_at, url: c.html_url })),
    ...(Array.isArray(statuses) ? statuses : []).map(c => ({ id: c.id, name: c.context, sha,
      app_id: c.creator?.id, conclusion: c.state === 'success' ? 'success' : c.state,
      started_at: c.created_at, url: c.target_url }))
  ];
  const report = reconcile(expected, observed, sha);
  if (!rules || !checks || !statuses || (checks.total_count || 0) > (checks.check_runs || []).length ||
      (Array.isArray(rules) && rules.length === 100) || (Array.isArray(statuses) && statuses.length === 100)) {
    report.state = 'UNKNOWN'; report.reason = 'INCOMPLETE_PROVIDER_OBSERVATION';
  }
  if (errors.length) { report.state = 'UNKNOWN'; report.reason = 'GITHUB_API_READ_FAILED'; }
  report.expected = expected; report.observed = observed; report.errors = errors;
  report.remediation = classifyRemediation(report);
  return report;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const repo = process.env.GITHUB_REPOSITORY, sha = process.env.RELEASE_CHECK_SHA;
  const branch = process.env.RELEASE_BASE_BRANCH || 'main';
  let report;
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo || '') || !validSha(sha) || !/^[\w./-]+$/.test(branch))
    report = { state: 'UNKNOWN', reason: 'INVALID_REPOSITORY_SHA_OR_BRANCH' };
  else try { report = inspect(repo, branch, sha); }
  catch (e) { report = { state: 'UNKNOWN', reason: String(e.message || e) }; }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  if (report.state !== 'PASS') process.exitCode = 1;
}
