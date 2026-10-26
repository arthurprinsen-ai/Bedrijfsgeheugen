import { createHash } from 'node:crypto';

// Read-only test failure clustering for the existing Unified BRAIN lane.
// Categories are hypotheses, never proof of a fix or permission to skip tests.
const LIMIT = 5000;
const MAX_SAMPLES = 12;
function redact(text) {
  return String(text ?? '')
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/(authorization\s*:\s*bearer\s+)[^\s,;]+/gi, '$1[redacted]')
    .replace(/\bbearer\s+[^\s,;]+/gi, 'bearer [redacted]')
    .replace(/\b(password|passwd|token|secret|api[_-]?key)\s*[=:]\s*([^\s,;]+)/gi, '$1=[redacted]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .trim().slice(0, 260);
}
const digest = text => createHash('sha256').update(text).digest('hex').slice(0, 20);

function classification(context) {
  if (/ENOENT[^\n]*supabase\/migrations\//i.test(context))
    return 'MISSING_EXECUTABLE_SQL_SOURCE';
  if (/ENOENT[^\n]*\.github\/workflows\//i.test(context))
    return 'MISSING_WORKFLOW_SOURCE';
  if (/ENOENT/i.test(context))
    return 'MISSING_OTHER_SOURCE';
  if (/ERR_ASSERTION|AssertionError|expected:|actual:/i.test(context))
    return 'ASSERTION_MISMATCH';
  return 'UNCLASSIFIED_FAILURE';
}

/** Failure candidates extracted from TAP logs. No inferred successful tests. */
export function clusterBrainFailures(log, { headSha = '', runId = '', lane = 'backend' } = {}) {
  const rows = String(log ?? '').split(/\r?\n/);
  const matches = [];
  for (let i = 0; i < rows.length; i++) {
    const m = rows[i].trim().match(/^not ok\s+(\d+)\s+-\s+(.+)$/);
    if (!m) continue;
    const before = rows.slice(Math.max(0, i - 8), i).join('\n');
    const after = rows.slice(i + 1, Math.min(rows.length, i + 14)).join('\n');
    // Node's ENOENT diagnostic can precede the not-ok line; restrict to the
    // local failure window rather than guessing from any other test in the run.
    const local = before + '\n' + after;
    const category = classification(local);
    const title = redact(m[2]);
    const exactFile = title.match(/tests\/[\w./-]+\.test\.(?:mjs|js|cjs)/)?.[0] || null;
    const signature = category + '|' + (exactFile || title);
    matches.push({
      index: Number(m[1]),
      title,
      category,
      file: exactFile,
      fingerprint: 'brain-test|' + digest(signature),
      evidence_line: i + 1,
    });
  }
  const reported = [...rows].reverse().find(x => /^\s*# fail\s+\d+\s*$/.test(x));
  const n = reported ? Number(reported.match(/# fail\s+(\d+)/)[1]) : null;
  const complete = matches.length <= LIMIT && n !== null && n === matches.length;
  const groups = new Map();
  for (const item of matches.slice(0, LIMIT)) {
    const g = groups.get(item.category) || { category: item.category, count: 0, distinct_test_fingerprints: [], examples: [] };
    g.count++;
    if (!g.distinct_test_fingerprints.includes(item.fingerprint)) g.distinct_test_fingerprints.push(item.fingerprint);
    if (g.examples.length < MAX_SAMPLES) g.examples.push({ index: item.index, title: item.title, file: item.file, evidence_line: item.evidence_line });
    groups.set(item.category, g);
  }
  return {
    contract: 'powerhouse-unified-brain-full-failure-clusters-v1',
    fingerprint: 'delivery|brain|first-failure-only-learning-blindspot|20261022-v1',
    status: 'OBSERVED_NOT_REPAIRED',
    head_sha: String(headSha), run_id: String(runId), lane: String(lane),
    reported_failures: n,
    extracted_failures: matches.length,
    coverage_complete: complete,
    truncated: matches.length > LIMIT,
    categories: [...groups.values()].sort((a, b) => b.count - a.count || a.category.localeCompare(b.category)),
    requires_exact_head_zero_failure_rerun: true,
    requires_source_root_cause_verification: true,
    // This is triage evidence, not an alternative incident store or promotion gate.
    canonical_failure_authority: 'public.brain_failure_registry',
  };
}
