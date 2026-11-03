import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { indexPullRequests, classifyBranch, decide, archiveTagName, archiveProviderFailure } from '../tools/ci/branch-archive-sweep.mjs';

const repo = 'acme/home';
const pr = (over) => ({ state: 'closed', merged_at: null, head: { ref: 'b', sha: 's1', repo: { full_name: 'acme/home' } }, ...over });
const idx = (prs) => indexPullRequests(prs, repo);

test('reserved, protected and open-PR branches are never candidates', () => {
  assert.equal(classifyBranch({ name: 'main', sha: 's1' }, idx([])).skip, 'RESERVED');
  for (const name of ['archive/x', 'release/1', 'hotfix/y']) assert.equal(classifyBranch({ name, sha: 's1' }, idx([])).skip, 'RESERVED');
  assert.equal(classifyBranch({ name: 'b', sha: 's1', protected: true }, idx([])).skip, 'PROTECTED');
  assert.equal(classifyBranch({ name: 'b', sha: 's1' }, idx([pr({ state: 'open' })])).skip, 'OPEN_PR');
});

test('foreign-repository PR heads never count as evidence', () => {
  const foreign = pr({ merged_at: 'x', head: { ref: 'b', sha: 's1', repo: { full_name: 'other/repo' } } });
  assert.equal(classifyBranch({ name: 'b', sha: 's1' }, idx([foreign])).kind, 'UNIQUE_OR_CONTAINED');
});

test('exact merged head and exact closed head delete without a tag', () => {
  const merged = classifyBranch({ name: 'b', sha: 's1' }, idx([pr({ merged_at: 'x' })]));
  assert.deepEqual(decide(merged, {}), { action: 'DELETE', reason: 'MERGED_EXACT_HEAD' });
  const closed = classifyBranch({ name: 'b', sha: 's1' }, idx([pr()]));
  assert.equal(decide(closed, { ageDays: 2 }).action, 'DELETE');
  assert.equal(decide(closed, { ageDays: 0.1 }).reason, 'TOO_YOUNG');
});

test('moved heads and branches without PR keep their work via archive tag', () => {
  const moved = classifyBranch({ name: 'b', sha: 's2' }, idx([pr({ merged_at: 'x' })]));
  assert.equal(decide(moved, { aheadBy: 4, ageDays: 10 }).action, 'ARCHIVE_THEN_DELETE');
  assert.equal(decide(moved, { aheadBy: 0, ageDays: 0 }).reason, 'CONTAINED_IN_MAIN');
  assert.equal(decide(moved, { aheadBy: 4, ageDays: 1 }).reason, 'TOO_YOUNG');
  assert.equal(decide(moved, { aheadBy: undefined, ageDays: 99 }).reason, 'AHEAD_UNPROVEN');
});

test('archive tag never overwrites a different sha', () => {
  assert.equal(archiveTagName('feat/x', 'abcdef1234', null), 'archive/feat/x');
  assert.equal(archiveTagName('feat/x', 'abcdef1234', 'abcdef1234'), 'archive/feat/x');
  assert.equal(archiveTagName('feat/x', 'abcdef1234', 'ffffff'), 'archive/feat/x-abcdef1');
});

test('janitor runs the sweep with a cap and only against its own repository', () => {
  const wf = readFileSync('.github/workflows/powerhouse-repository-janitor.yml', 'utf8');
  assert.match(wf, /node tools\/ci\/branch-archive-sweep\.mjs --apply --cap 150/);
  const src = readFileSync('tools/ci/branch-archive-sweep.mjs', 'utf8');
  // Reject actual repository override flags; '--report' is evidence, not '--repo'.
  assert.ok(!/--repo(?:\s|=)|-R\s/.test(src));
});

test('sweep has a time budget, a circuit breaker and a hard timeout in the janitor', () => {
  const src = readFileSync('tools/ci/branch-archive-sweep.mjs', 'utf8');
  assert.match(src, /SWEEP_BUDGET_SECONDS/);
  assert.match(src, /consecutiveArchiveFailures >= 3/);
  const wf = readFileSync('.github/workflows/powerhouse-repository-janitor.yml', 'utf8');
  assert.match(wf, /branch_archive_sweep:[\s\S]*timeout-minutes: 20[\s\S]*timeout 1000 node tools\/ci\/branch-archive-sweep\.mjs/);
});


test('original Janitor preserves per-branch HTTP403 with exact action/run evidence', () => {
  const error = { stderr: '{"message":"Resource not accessible by integration","status":"403"} gh: Resource not accessible by integration (HTTP 403)' };
  const event = archiveProviderFailure(error, {
    phase:'CREATE_ARCHIVE_TAG',branch:'automation/example',sha:'abc',
    runId:'41546047078',runAttempt:'1',sourceSha:'c591882884f7fb4a1b4d0b679df08c0291bb66dc'
  });
  assert.equal(event.status, 'PARTIAL_FAILURE');
  assert.equal(event.provider_http_status, 403);
  assert.equal(event.reason, 'PROVIDER_PERMISSION_DENIED');
  assert.equal(event.action, 'CREATE_ARCHIVE_TAG');
  assert.equal(event.run_id, 41546047078);
  assert.equal(event.branch_deleted, false);
  assert.equal(event.archive_verified, false);
  assert.equal(event.incident_number, 5333);
  assert.equal('stderr' in event, false, 'provider body/token must never be uploaded');
});

test('unknown provider error cannot be promoted to success', () => {
  const event = archiveProviderFailure(new Error('tag readback mismatch'), { phase:'VERIFY_ARCHIVE_TAG_READBACK' });
  assert.equal(event.status, 'PARTIAL_FAILURE');
  assert.equal(event.provider_http_status, null);
  assert.equal(event.branch_deleted, false);
});

test('original archive job fails on partial error and always preserves independent provider evidence', () => {
  const src = readFileSync('tools/ci/branch-archive-sweep.mjs','utf8');
  const wf = readFileSync('.github/workflows/powerhouse-repository-janitor.yml','utf8');
  const job = wf.split('  branch_archive_sweep:\n')[1];
  assert.ok(job);
  assert.match(src,/if \(outcome\.failed > 0\) process\.exitCode = 78/);
  assert.match(src,/consecutiveArchiveFailures >= 3/);
  assert.match(src,/phase = 'CREATE_ARCHIVE_TAG'/);
  assert.match(src,/phase = 'VERIFY_ARCHIVE_TAG_READBACK'/);
  assert.match(src,/if \(readback !== branch\.sha\) throw/);
  assert.match(job,/timeout 1000 node tools\/ci\/branch-archive-sweep\.mjs --apply --cap 150/);
  assert.match(job,/--actions \.artifacts\/branch-archive-actions\.ndjson/);
  assert.match(job,/--report \.artifacts\/branch-archive-sweep\.json/);
  assert.doesNotMatch(job,/\|\|\s*echo.*JANITOR_ARCHIVE_SWEEP_INCOMPLETE/);
  assert.match(job,/- name: Upload original branch archive provider evidence\s+if: always\(\)/);
  assert.match(job,/if-no-files-found: warn/);
});


test('installation quota 403 is distinct from tag-write authorization and always recorded',()=>{
  const error={stderr:'gh: API rate limit exceeded for installation. (HTTP 403)'};
  const incident=archiveProviderFailure(error,{
    phase:'READ_BRANCH_COMMIT',branch:'automation/example',sha:'a'.repeat(40),
    runId:'41595648620',runAttempt:'1',sourceSha:'b'.repeat(40)
  });
  assert.equal(incident.reason,'PROVIDER_RATE_LIMIT_EXCEEDED');
  assert.equal(incident.incident_number,5341);
  assert.equal(incident.fingerprint,'github|janitor-archive-sweep|installation-rate-limit-uncaught-after-tag403|20261103-v1');
  assert.equal(incident.provider_http_status,403);
  assert.equal(incident.action,'READ_BRANCH_COMMIT');
  assert.equal(incident.archive_verified,false);
  assert.equal(incident.branch_deleted,false);
  assert.equal('stderr' in incident,false);
  const denied=archiveProviderFailure({stderr:'Resource not accessible by integration (HTTP 403)'},{phase:'CREATE_ARCHIVE_TAG'});
  assert.equal(denied.reason,'PROVIDER_PERMISSION_DENIED');
  assert.equal(denied.incident_number,5333);
});

test('the original sweep bounds branch probes and rotates the window over scheduled runs',()=>{
  const src=readFileSync('tools/ci/branch-archive-sweep.mjs','utf8');
  assert.match(src,/SWEEP_BRANCH_PROBE_BUDGET/);
  assert.match(src,/Math\.max\(1, Math\.min\(60, requestedProbeBudget\)\)/);
  assert.match(src,/GITHUB_RUN_NUMBER/);
  assert.match(src,/windowStart = branches\.length \? \(\(runOrdinal - 1\) \* probeBudget\) % branches\.length/);
  assert.match(src,/for \(const branch of selectedBranches\)/);
  assert.match(src,/selectedBranches\.length < branches\.length \? 'BOUNDED_WINDOW_VERIFIED_NOT_FULL_SWEEP'/);
  assert.match(src,/scan_scope_full: selectedBranches\.length === branches\.length/);
});

test('archive permission circuit breaker stops further GitHub provider reads',()=>{
  const src=readFileSync('tools/ci/branch-archive-sweep.mjs','utf8');
  const loop=src.split('for (const branch of selectedBranches) {')[1];
  assert.ok(loop);
  const breaker=loop.indexOf('if (consecutiveArchiveFailures >= 3)');
  const getCommit=loop.indexOf("const commit = JSON.parse(gh(");
  assert.ok(breaker >=0 && getCommit > breaker,'circuit breaker before any commit API call');
  assert.match(loop,/JANITOR_ARCHIVE_CIRCUIT_BREAKER_OPEN:3_PROVIDER_TAG_DENIALS/);
  assert.match(src,/if \(incident\.reason === 'PROVIDER_RATE_LIMIT_EXCEEDED'\) break/);
});

test('all branch provider reads are in typed failure catch, not thrown unreported',()=>{
  const src=readFileSync('tools/ci/branch-archive-sweep.mjs','utf8');
  const loop=src.split('for (const branch of selectedBranches) {')[1];
  assert.ok(loop);
  const firstTry=loop.indexOf('    try {');
  const readCommit=loop.indexOf("const commit = JSON.parse(gh(");
  const compare=loop.indexOf('const cmp = gh(');
  const catchClause=loop.indexOf('    } catch (error) {',readCommit);
  assert.ok(firstTry < readCommit && readCommit < compare && compare < catchClause);
  assert.match(loop,/archiveProviderFailure\(error,/);
  assert.match(loop,/if \(actionsFile\) appendFileSync\(actionsFile, JSON\.stringify\(incident\)/);
  assert.match(src,/if \(outcome\.failed > 0\) process\.exitCode = 78/);
});


test('inventory rate limit writes typed original action/report before failing the job',()=>{
  const src=readFileSync('tools/ci/branch-archive-sweep.mjs','utf8');
  const cli=src.split("if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {")[1];
  assert.ok(cli);
  assert.match(cli,/catch \(error\)/);
  assert.match(cli,/READ_INITIAL_INVENTORY_OR_SWEEP_SETUP/);
  assert.match(cli,/appendFileSync\(actionsFile, JSON\.stringify\(incident\)/);
  assert.match(cli,/writeFileSync\(reportFile, JSON\.stringify\(/);
  assert.match(cli,/process\.exitCode = 78/);
  assert.doesNotMatch(cli,/\|\|\s*echo/);
});


test('missing comparison readback cannot be parsed as zero ahead and delete unique work',()=>{
  const src=readFileSync('tools/ci/branch-archive-sweep.mjs','utf8');
  assert.match(src,/const rawAhead = cmp === null \? '' : cmp\.trim\(\)/);
  assert.ok(src.includes('aheadBy = /^\\d+$/.test(rawAhead) ? Number(rawAhead) : undefined;'));
  for (const raw of ['', 'null', 'UNPROVEN', '403', '  ']){
    const ahead = /^\d+$/.test(raw.trim()) ? Number(raw.trim()) : undefined;
    if(raw.trim()==='' || raw==='UNPROVEN'||raw==='null')assert.equal(ahead,undefined);
  }
  const unknown=decide({kind:'UNIQUE_OR_CONTAINED',minAgeDays:0},{aheadBy:undefined,ageDays:100});
  assert.equal(unknown.action,'SKIP');
  assert.equal(unknown.reason,'AHEAD_UNPROVEN');
});
