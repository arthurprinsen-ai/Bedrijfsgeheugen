import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync(new URL('../.github/workflows/powerhouse-repository-janitor.yml', import.meta.url),'utf8');

test('repository janitor runs hourly and paginates the complete open PR set',()=>{
  assert.match(source,/cron: '17 \* \* \* \*'/);
  assert.match(source,/gh api --paginate --slurp "repos\/\$\{GITHUB_REPOSITORY\}\/pulls\?state=open&per_page=100" \| jq 'add'/);
});

test('stale no-open-PR cleanup only adds TTL auto-cancel for queued runs',()=>{
  assert.match(source,/\[ "\$run_status" = queued \]/);
  assert.match(source,/stale_after_seconds=21600/);
  assert.match(source,/reason=STALE_QUEUED_NO_OPEN_PR/);
  assert.doesNotMatch(source,/\[ "\$run_status" = in_progress \].*STALE_QUEUED_NO_OPEN_PR/s);
});

test('janitor preserves main and current open-PR head before any cancellation',()=>{
  assert.match(source,/\[ "\$branch" != main \] \|\| continue/);
  assert.match(source,/if \[ -n "\$current_pr_head" \] && \[ "\$current_pr_head" != "\$run_sha" \]/);
  assert.match(source,/elif \[ -z "\$current_pr_head" \]/);
});

test('janitor escalates proven obsolete runs through force-cancel and delete fallback',()=>{
  assert.match(source,/actions\/runs\/\$\{run_id\}\/force-cancel/);
  assert.match(source,/-X DELETE "repos\/\$\{GITHUB_REPOSITORY\}\/actions\/runs\/\$\{run_id\}"/);
  assert.match(source,/cancel_mode=force-cancel/);
  assert.match(source,/cancel_mode=delete-fallback/);
});


test('terminal lease reconciliation excludes retired open successors and accepts a merged successor',()=>{
  assert.match(source,/startswith\("RETIRED"\)/);
  assert.match(source,/Retirement-State: RETIRED_DO_NOT_MERGE/);
  assert.match(source,/merged_successor_count=/);
  assert.match(source,/TERMINAL_LEASE_SATISFIED_BY_MERGED_SUCCESSOR/);
});


test('janitor applies explicit successor chains oldest-first so it cannot invalidate its own successor readback',()=>{
  assert.match(source,/sort_by\(\.prNumber\)\[\]/);
  assert.match(source,/Successor #\$\{successor\} is no longer open/);
});


import { classifyGhostRun, ghostMarkers } from '../tools/delivery/github-ghost-run-reconcile.mjs';

const historicalRun={id:37642383514,status:'queued',conclusion:null,head_sha:'old',created_at:'2026-10-07T15:09:03Z',updated_at:'2026-10-07T15:09:03Z'};
const ghostContext={now:Date.parse('2026-10-22T15:00:00Z'),mainSha:'main',openHeads:new Set()};

test('provider ghost classification admits only aged queued zero-job obsolete heads',()=>{
  assert.equal(classifyGhostRun(historicalRun,0,ghostContext),'OBSOLETE_ZERO_JOB');
  assert.equal(classifyGhostRun(historicalRun,1,ghostContext),'HAS_JOBS_OR_UNKNOWN');
  assert.equal(classifyGhostRun({...historicalRun,head_sha:'main'},0,ghostContext),'CURRENT_MAIN_OR_UNKNOWN');
  assert.equal(classifyGhostRun(historicalRun,0,{...ghostContext,openHeads:new Set(['old'])}),'CURRENT_PR_HEAD');
  assert.equal(classifyGhostRun({...historicalRun,status:'in_progress'},0,ghostContext),'NOT_QUEUED');
  assert.equal(classifyGhostRun({...historicalRun,updated_at:'2026-10-22T14:00:00Z'},0,ghostContext),'PROGRESS_OR_UNKNOWN');
  assert.equal(classifyGhostRun({...historicalRun,created_at:'2026-10-22T14:59:00Z',updated_at:'2026-10-22T14:59:00Z'},0,ghostContext),'TOO_NEW');
});

test('provider ghost marker replay deduplicates failed requests across janitor runs',()=>{
  const found=ghostMarkers([
    {body:'GH_GHOST_RUN:37642383514:PROVIDER_BOUNDARY:2026-10-07T15:09:03Z'},
    {body:'GH_GHOST_RUN:37642383514:RECONCILED:deleted'}
  ]);
  assert.deepEqual(found.get(37642383514),{state:'RECONCILED',updatedAt:'deleted'});
  assert.equal(found.size,1);
});

test('existing janitor owns hourly ghost recovery, checkpoint and incident evidence',()=>{
  assert.match(source,/node tools\/delivery\/github-ghost-run-reconcile\.mjs/);
  assert.match(source,/issues: write/);
  assert.match(source,/ghost-blocked-ids\.txt/);
  assert.match(source,/PROVIDER_GHOST_SUPPRESSED/);
  const scanner=fs.readFileSync(new URL('../tools/delivery/github-ghost-run-reconcile.mjs',import.meta.url),'utf8');
  assert.match(scanner,/const INCIDENT = 4655/);
  assert.match(scanner,/GH_GHOST_RUN:/);
  assert.match(scanner,/jobs\?per_page=1/);
  assert.match(scanner,/classifyGhostRun\(fresh, recheckJobs.total_count/);
  assert.match(scanner,/RECOVERY_REQUESTED/);
  assert.match(scanner,/RECONCILED/);
});

test('existing five-minute supervisor skips previously escalated GitHub 409/403 ghost runs',()=>{
  const supervisor=fs.readFileSync(new URL('../.github/workflows/powerhouse-delivery-recovery-supervisor.yml',import.meta.url),'utf8');
  assert.match(supervisor,/KNOWN_PROVIDER_GHOST_ALREADY_ESCALATED/);
  assert.match(supervisor,/issues\/4655\/comments/);
  assert.match(supervisor,/provider_ghosts/);
  assert.match(supervisor,/GITHUB_PROVIDER/);
});
