import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcile, effectiveRequirements, inspect, classifyRemediation } from '../tools/delivery/required-check-reconciliation.mjs';
const sha = 'a'.repeat(40);
const req = [{ context: 'Required / test', integration_id: 15368 }];
const check = { id: 2, name: 'Required / test', sha, app_id: 15368, conclusion: 'success', started_at: '2026-10-25T12:00:00Z' };
test('exact SHA/app/context passes', () => assert.equal(reconcile(req, [check], sha).state, 'PASS'));
test('stale SHA fails closed', () => assert.deepEqual(reconcile(req, [{ ...check, sha: 'b'.repeat(40) }], sha).missing, ['Required / test']));
test('wrong integration fails closed', () => assert.deepEqual(reconcile(req, [{ ...check, app_id: 9 }], sha).wrongSource, ['Required / test']));
test('missing name fails closed', () => assert.equal(reconcile(req, [{ ...check, name: 'old' }], sha).state, 'BLOCKED_CONFIG_OR_CHECK'));
test('pending fails closed', () => assert.deepEqual(reconcile(req, [{ ...check, conclusion: null }], sha).incomplete, ['Required / test']));
test('latest rerun supersedes previous successful run', () => assert.equal(reconcile(req, [check, { ...check, id: 3, conclusion: 'failure', started_at: '2026-10-25T13:00:00Z' }], sha).state, 'BLOCKED_CONFIG_OR_CHECK'));
test('extracts rulesets and branch protection', () => assert.equal(effectiveRequirements({ checks: [{ context: 'A', app_id: 1 }] }, [{ type: 'required_status_checks', parameters: { required_status_checks: [{ context: 'B', integration_id: 2 }] } }]).length, 2));
test('effective organization rule without legacy branch protection', () => {
  const api = path => path.includes('/rules/branches/') ? [{ type: 'required_status_checks', parameters: { required_status_checks: [{ context: check.name, integration_id: 15368 }] } }] : path.includes('/protection/') ? null : path.includes('/check-runs') ? { total_count: 1, check_runs: [{ ...check, head_sha: sha, name: check.name, app: { id: 15368 }, status: 'completed', html_url: 'https://github.com/example', started_at: check.started_at }] } : [];
  assert.equal(inspect('owner/repo', 'main', sha, api).state, 'PASS');
});
test('unreadable effective rules are UNKNOWN', () => assert.equal(inspect('o/r', 'main', sha, () => null).state, 'UNKNOWN'));
test('explicit remediation never greenwashes configuration drift', () => assert.equal(classifyRemediation({ state: 'BLOCKED_CONFIG_OR_CHECK', wrongSource: ['A'] }), 'ADMIN_OR_PERMISSION_REVIEW'));
