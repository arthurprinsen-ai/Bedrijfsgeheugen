import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {classifyOriginalBrainFlightPages} from '../tools/delivery/brain-verification-flight-index.mjs';

// Existing historical suite remains the authority; this canonical entrypoint
// makes its actual regressions executable by the ONE BRAIN learning gate.
import './github-delivery-state-machine-terminal-closure.test.mjs';

test('original terminal extra contract never falls back to first 100 BRAIN runs',()=>{
  const closure=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
  const tail=closure.split('name: Verify exact-head critical delivery gates before terminal claim')[1]
    ?.split('name: Require explicit Supabase Edge Function provider readback before terminal claim')[0];
  assert.ok(tail,'same original final terminal acceptance gate exists');
  assert.match(tail,/originalBrainFlightSince/);
  assert.match(tail,/gh api --paginate --slurp "\$query"/);
  assert.match(tail,/brain-verification-flight-index\.mjs --title "\$expected_title" --since "\$since"/);
  assert.match(tail,/TERMINAL_BRAIN_WORKFLOW_SOURCE_NOT_PROTECTED_MAIN/);
  assert.match(tail,/TERMINAL_CRITICAL_GATE_FAILED/);
  assert.doesNotMatch(tail,/runs\?branch=main&event=workflow_dispatch&per_page=100/);
  const sha='a'.repeat(40);
  const title='BRAIN delivery PR #5825 '+sha;
  const rows=Array.from({length:206},(_,i)=>({
    id:1000+i,created_at:'2026-11-15T08:54:05Z',head_branch:'main',
    event:'workflow_dispatch',status:'completed',conclusion:'success',
    display_title:i===205?title:'BRAIN delivery PR #9999 '+('b'.repeat(40))
  }));
  const pages=Array.from({length:3},(_,i)=>({
    total_count:206,workflow_runs:rows.slice(i*100,(i+1)*100)
  }));
  const proof=classifyOriginalBrainFlightPages(pages,title,{since:'2026-11-15T08:45:00Z'});
  assert.equal(proof.complete,true);
  assert.equal(proof.status,'EXISTING_FLIGHT');
  assert.equal(proof.run_id,1205,'source-bound run may be in third provider page');
  assert.equal(classifyOriginalBrainFlightPages(pages.slice(0,2),title,{since:'2026-11-15T08:45:00Z'}).safe_to_dispatch,false,
    'missing provider page must fail closed');
});
