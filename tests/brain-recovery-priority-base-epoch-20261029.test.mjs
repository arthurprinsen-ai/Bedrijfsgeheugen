import test from 'node:test';
import assert from 'node:assert/strict';
import {rankRecoveryCandidates} from '../tools/delivery/recovery-pr-prioritizer.mjs';

const repo='arthurprinsen-ai/Bedrijfsgeheugen';
const MAIN='a'.repeat(40),OLD='b'.repeat(40),HEAD='c'.repeat(40),OLD_HEAD='d'.repeat(40);
const now=Date.parse('2026-10-29T16:05:00Z');

function candidate(number,{head=HEAD,leaseEpoch=MAIN,baseTip=OLD,updated='2026-10-29T16:03:00Z'}={}){
  return {number,state:'open',draft:false,updated_at:updated,
    head:{sha:head,repo:{full_name:repo}},
    base:{sha:baseTip,repo:{full_name:repo}},
    body:[
      'Obligation-ID: delivery|recovery-priority-base-drift|20261029-v1',
      'Base-SHA: '+leaseEpoch,
      'Writer-Lease-State: TERMINAL_DELIVERY',
      'Writer-Lease-Owner: arthurprinsen-ai',
      'Writer-Lease-Head: '+head,
      'Writer-Lease-Main-Epoch: '+leaseEpoch,
      'Writer-Lease-Obligation: delivery|recovery-priority-base-drift|20261029-v1',
      'Writer-Lease-Drift-Refreshes: 0'
    ].join('\n')
  };
}
const exactRequired=(number,head,status='completed',conclusion='success')=>({
  id:100000+number,name:'Required test PR #'+number+' '+head,
  head_sha:head,event:'pull_request',status,conclusion,
  created_at:'2026-10-29T16:02:00Z',
  updated_at:'2026-10-29T16:04:00Z'
});
const rank=(prs,runs)=>rankRecoveryCandidates({prs,requiredRuns:runs,repo,mainSha:MAIN,now});

test('PR #5134 regression: exact-head green with current lease epoch but older PR base outranks stale no-evidence #3978',()=>{
  const old=candidate(3978,{head:OLD_HEAD,leaseEpoch:OLD,baseTip:OLD,updated:'2026-10-01T10:00:00Z'});
  const fresh=candidate(5134);
  const before=structuredClone([old,fresh]);
  const out=rank([old,fresh],[exactRequired(5134,HEAD)]);
  assert.equal(out.ordered_prs[0].number,5134);
  assert.equal(out.rankings[0].observed_completed_exact_head_required_success,true);
  assert.equal(out.rankings[0].base_snapshot_differs_from_main,true);
  assert.equal(out.rankings[1].number,3978);
  assert.equal(out.safety.cas_and_lease_preflight_required,true);
  assert.equal(out.safety.mutation_authority,false);
  assert.equal(out.safety.skip_required_or_codeql,false);
  assert.deepEqual([old,fresh],before);
});

test('malformed/missing PR base cannot be invented as a drift signal',()=>{
  const old=candidate(3978,{head:OLD_HEAD,leaseEpoch:OLD});
  const missing=candidate(5134,{baseTip:undefined});
  delete missing.base.sha;
  const output=rank([old,missing],[exactRequired(5134,HEAD)]);
  assert.equal(output.rankings[0].number,3978);
  assert.equal(output.rankings[1].base_snapshot_differs_from_main,false);
});

test('candidate with active exact-head Required is not prioritized for a second recovery write',()=>{
  const old=candidate(3978,{head:OLD_HEAD,leaseEpoch:OLD});
  const current=candidate(5134);
  const output=rank([old,current],[exactRequired(5134,HEAD,'in_progress',null)]);
  assert.equal(output.rankings[0].number,3978);
  assert.equal(output.rankings[1].observed_active_required,true);
  assert.equal(output.safety.max_drift_refreshes,2);
});

test('a fully up-to-date base and current lease epoch does not fabricate drift',()=>{
  const old=candidate(3978,{head:OLD_HEAD,leaseEpoch:OLD});
  const fresh=candidate(5134,{baseTip:MAIN});
  const output=rank([old,fresh],[exactRequired(5134,HEAD)]);
  assert.equal(output.rankings[0].number,3978);
  assert.equal(output.rankings[1].base_snapshot_differs_from_main,false);
});
