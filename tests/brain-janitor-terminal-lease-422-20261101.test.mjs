import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const workflow = readFileSync(new URL('../.github/workflows/powerhouse-repository-janitor.yml', import.meta.url), 'utf8');
const begin = workflow.indexOf('# Active TERMINAL_DELIVERY lease');
const end = workflow.indexOf('# Cancel only stale candidate executions.', begin);
const lease = workflow.slice(begin, end);
const sweep = workflow.slice(workflow.indexOf('# Delete only unprotected non-main refs'));

function jq(filter, data, args = []) {
  const r = spawnSync('jq', ['-r', ...args, filter], {input: JSON.stringify(data), encoding: 'utf8'});
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
}
test('replay: closed #2225 is in bounded window but older merged successor #2353 is not', () => {
  const predecessor = {
    number: 2225, state: 'closed', merged_at: null,
    body: 'Obligation-ID: seo-clean-url-bedrijf-overdraagbaar-maken-v1\nWriter-Lease-State: TERMINAL_DELIVERY'
  };
  const successor = {
    number: 2353, state: 'closed', merged_at: '2026-09-19T12:09:26Z',
    body: 'Obligation-ID: seo-clean-url-bedrijf-overdraagbaar-maken-v1\nSupersedes: 2225'
  };
  const recent = [predecessor]; // Deliberate finite 100-item view omits older merged successor.
  const selected = jq('.[] | select((.merged_at == null) and ((.body // "") | contains("Writer-Lease-State: TERMINAL_DELIVERY"))) | .number', recent);
  assert.equal(selected, '2225');
  const filter = '[.[] | select(.number != $pr) | select(.merged_at != null) | select((.body // "") | contains("Obligation-ID: " + $obligation))] | length';
  const args = ['--arg', 'obligation', 'seo-clean-url-bedrijf-overdraagbaar-maken-v1', '--argjson', 'pr', '2225'];
  assert.equal(jq(filter, recent, args), '0');
  assert.equal(jq(filter, [predecessor, successor], args), '1');
  assert.doesNotMatch(lease, /gh api -X PATCH[\s\S]*state=open/, 'an absent result in bounded recent history must never authorize reopen');
  assert.match(lease, /TERMINAL_LEASE_REOPEN_DEFERRED_HISTORY_UNPROVEN/);
  assert.match(lease, /requires_owner_readback:true,reopened:false/);
});
test('closed terminal lease candidate producer cannot break pipe into an early-failing consumer', () => {
  assert.match(lease, /\.artifacts\/closed-prs-recent\.json > \.artifacts\/terminal-lease-candidates\.ndjson/);
  assert.match(lease, /done < \.artifacts\/terminal-lease-candidates\.ndjson/);
  assert.doesNotMatch(lease, /closed-prs-recent\.json \| while/);
  assert.doesNotMatch(lease, /gh api -X PATCH/);
});
test('stale Actions JSON stream is materialized before a fallible cancellation loop', () => {
  assert.match(workflow, /janitor-action-runs-\\\$\\{status\\}\\.ndjson/);
  assert.match(workflow, /done < "\\.artifacts\\/janitor-action-runs-/);
  assert.doesNotMatch(workflow, /@json' \\| while read -r run_json/);
});
test('branch candidates are materialized, and deletion gives a contextual primary error', () => {
  assert.match(sweep, /--jq '\.\[\]\.name' > \.artifacts\/janitor-branch-candidates\.txt/);
  assert.match(sweep, /done < \.artifacts\/janitor-branch-candidates\.txt/);
  assert.match(sweep, /JANITOR_BRANCH_DELETE_API_REJECTED:branch=/);
  assert.equal((sweep.match(/JANITOR_BRANCH_DELETE_API_REJECTED:branch=/g)||[]).length, 2);
  assert.match(sweep, /JANITOR_BRANCH_HEAD_DRIFT/);
  assert.match(sweep, /if \.protected == false then "false" else "true" end/);
});
test('open PR provider pagination is separated from JSON normalization', () => {
  assert.match(lease, /pulls\?state=open&per_page=100" > \.artifacts\/open-prs-pages\.json/);
  assert.match(lease, /jq 'add' \.artifacts\/open-prs-pages\.json > \.artifacts\/open-prs-after\.json/);
});
test('legacy terminal decision is explicitly blocked, not reported success from a small sample', () => {
  assert.match(lease, /BOUNDED_CLOSED_PR_SAMPLE_NOT_GLOBAL_LINEAGE_PROOF/);
  assert.match(lease, /TERMINAL_LEASE_SATISFIED_BY_MERGED_SUCCESSOR/);
  assert.match(lease, /TERMINAL_LEASE_SUCCESSOR_AMBIGUOUS/);
  assert.doesNotMatch(lease, /AUTO_REOPEN_TERMINAL_LEASE/);
});
