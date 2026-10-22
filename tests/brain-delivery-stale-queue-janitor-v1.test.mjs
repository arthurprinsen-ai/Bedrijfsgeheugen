import { classifyGhost, evidenceIds } from '../.github/scripts/github-actions-ghost-reconcile.mjs';
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


test('old queued zero-job runs on superseded heads are recognized for bounded recovery',()=>{
  const run={id:37642383514,status:'queued',conclusion:null,created_at:'2026-10-07T15:09:03Z',updated_at:'2026-10-07T15:09:03Z',head_branch:'main',head_sha:'b48cb332c7a776ee7002d33df8ecbdb0b0516f9a'};
  const outcome=classifyGhost(run,{jobsTotal:0,mainSha:'682fd5df573b3b0397f7a2fa77b3f37f14099ca7',now:Date.parse('2026-10-22T15:09:03Z')});
  assert.deepEqual(outcome,{eligible:true,reason:'STALE_ZERO_JOB_NON_AUTHORITATIVE_HEAD'});
});

test('no cancellation or deletion for current main, current PR head, real jobs, or immature runs',()=>{
  const run={id:1,status:'queued',conclusion:null,created_at:'2026-10-07T15:09:03Z',updated_at:'2026-10-07T15:09:03Z',head_branch:'fix/test',head_sha:'abc'};
  const base={jobsTotal:0,mainSha:'def',now:Date.parse('2026-10-22T15:09:03Z')};
  assert.equal(classifyGhost(run,{...base,mainSha:'abc'}).eligible,false);
  assert.equal(classifyGhost(run,{...base,openHeadShas:['abc']}).eligible,false);
  assert.equal(classifyGhost(run,{...base,jobsTotal:1}).eligible,false);
  assert.equal(classifyGhost(run,{...base,jobsTotal:undefined}).eligible,false);
  assert.equal(classifyGhost({...run,status:'in_progress'},base).eligible,false);
  assert.equal(classifyGhost({...run,updated_at:'2026-10-08T15:09:03Z'},base).eligible,false);
  assert.equal(classifyGhost(run,{...base,now:Date.parse('2026-10-07T15:10:03Z')}).eligible,false);
});

test('provider failed-attempt markers deduplicate retries and preserve exact run lineage',()=>{
  const evidence=evidenceIds('prior incident',['ignored',{body:'GHOST_RUN_PROVIDER_BLOCKED:37642383514\nGHOST_RUN_PENDING:37642383517\nGHOST_RUN_RESOLVED:37642383514'}]);
  assert.deepEqual([...evidence.ids].sort(),[37642383514,37642383517]);
  assert.deepEqual([...evidence.completed],[37642383514]);
});

test('hourly janitor owns provider-ghost retries, artifacts, and issue persistence without a second schedule',()=>{
  const supervisor=fs.readFileSync(new URL('../.github/workflows/powerhouse-delivery-recovery-supervisor.yml',import.meta.url),'utf8');
  const script=fs.readFileSync(new URL('../.github/scripts/github-actions-ghost-reconcile.mjs',import.meta.url),'utf8');
  assert.match(source,/name: Reconcile provider-owned GitHub Actions zero-job ghosts/);
  assert.match(source,/github-actions-ghost-reconcile\.mjs/);
  assert.match(source,/github-actions-ghost-reconcile\.json/);
  assert.match(source,/issues: write/);
  assert.match(source,/GITHUB_PROVIDER_GHOST_OBSERVED/);
  assert.match(supervisor,/GITHUB_PROVIDER_GHOST_RECONCILER_OWNS/);
  assert.match(script,/GHOST_RUN_PROVIDER_BLOCKED/);
  assert.match(script,/MAX_REPAIR_PER_SWEEP = 8/);
  assert.match(script,/\/issues\/' \+ GHOST_INCIDENT \+ '\/comments'/);
  assert.doesNotMatch(script,/schedule:|workflow_dispatch:/);
});
