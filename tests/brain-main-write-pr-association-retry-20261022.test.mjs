import test from 'node:test';
import assert from 'node:assert/strict';
import { readMainWritePullRequests, MAIN_WRITE_ASSOCIATION_DELAYS_MS } from '../tools/main-write-pr-association-retry.mjs';
import { classifyMainWrite } from '../tools/main-write-integrity.mjs';
const sha = '4ce0846ca51227169389241d3a122b274795a0b2';
const governed = [{ number: 4658, merged_at: '2026-10-22T15:43:18Z', base: { ref: 'main' }, merge_commit_sha: sha }];
const normalize = prs => prs?.map(pr => ({ number: pr.number, merged: Boolean(pr.merged_at), baseRef: pr.base?.ref ?? null, mergeCommitSha: pr.merge_commit_sha ?? null }));
const classify = prs => classifyMainWrite({ branch: 'main', parentCount: 1, changedPaths: ['.github/workflows/main-write-integrity.yml'], headSha: sha, associatedPullRequests: normalize(prs) });
const fast = { delaysMs: [1, 2], wait: async () => {} };
test('transient API failure retries and confirms exact merged PR', async () => {
  let n=0; const r=await readMainWritePullRequests({...fast,read:()=>{if(++n===1)throw Error('GitHub API outage');return governed;}});
  assert.equal(r.attempts,2);assert.equal(classify(r.pullRequests).status,'GOVERNED_SQUASH_MERGE');
});
test('temporarily empty association receives bounded recheck', async () => {
  let n=0; const r=await readMainWritePullRequests({...fast,read:()=>++n===1?[]:governed});
  assert.equal(r.attempts,2);assert.equal(classify(r.pullRequests).recoveryRequired,false);
});
test('permanently unavailable GitHub API remains UNKNOWN and not production green', async () => {
  let n=0;const delays=[];const r=await readMainWritePullRequests({delaysMs:[1,2],wait:async ms=>delays.push(ms),read:()=>{n++;throw Error('429');}});
  assert.equal(n,3);assert.deepEqual(delays,[1,2]);assert.equal(r.status,'ASSOCIATION_PROVIDER_UNAVAILABLE');
  assert.equal(classify(r.pullRequests).status,'UNKNOWN_MAIN_WRITE');
  assert.equal(classify(r.pullRequests).productionGreenAllowed,false);
});
test('three genuinely empty lookups still reject direct write', async () => {
  let n=0;const r=await readMainWritePullRequests({...fast,read:()=>{n++;return [];}});
  assert.equal(n,3);assert.equal(r.status,'NO_ASSOCIATION_AFTER_RECHECK');
  assert.equal(classify(r.pullRequests).status,'DIRECT_MAIN_WRITE_INCIDENT');
});
test('wrong SHA, wrong branch and unmerged PR cannot authorize main', async () => {
  for(const d of [{merge_commit_sha:'a'.repeat(40)},{base:{ref:'develop'}},{merged_at:null}]) {
    const r=await readMainWritePullRequests({...fast,read:()=>[{...governed[0],...d}]});
    assert.equal(classify(r.pullRequests).productionGreenAllowed,false);
  }
});
test('invalid response remains fail-closed; production delay budget bounded', async () => {
  const r=await readMainWritePullRequests({...fast,read:()=>({bad:true})});
  assert.equal(r.status,'ASSOCIATION_PROVIDER_UNAVAILABLE');
  assert.equal(classify(r.pullRequests).recoveryRequired,true);
  assert.deepEqual(MAIN_WRITE_ASSOCIATION_DELAYS_MS,[500,1500]);
});
