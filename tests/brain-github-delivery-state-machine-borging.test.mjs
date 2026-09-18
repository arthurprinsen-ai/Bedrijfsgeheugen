import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=p=>readFile(p,'utf8');
const fingerprint='github|delivery-state-machine|parallel-build-serialized-landing|v1';
const mergeSha='c3ecd9a00a37904249ebd3c4f06d3334f96400c4';

test('GitHub delivery state machine learning is production-proven with terminal evidence', async()=>{
  const learning=JSON.parse(await read('brain/learning/2026-09-18-github-delivery-state-machine-v1.json'));
  assert.equal(learning.fingerprint,fingerprint);
  assert.equal(learning.status,'ACTIVE_PREVENTION_PROVEN');
  assert.equal(learning.production_proof.merge_sha,mergeSha);
  assert.equal(learning.production_proof.main_readback,'verified');
  assert.equal(learning.production_proof.production_readback_run_id,35350501725);
  assert.equal(learning.production_proof.terminal_closure_run_id,35350499979);
  assert.equal(learning.production_proof.terminal_state,'LIVE_BEWEZEN');
  assert.equal(learning.production_proof.writer_lease_state,'RELEASED');
});

test('delivery and continuity skills expose the same proven terminalization rule', async()=>{
  const [delivery,continuity]=await Promise.all([
    read('.agents/skills/powerhouse-delivery-concurrency/SKILL.md'),
    read('.agents/skills/powerhouse-continuity/SKILL.md')
  ]);
  for(const skill of [delivery,continuity]){
    assert.ok(skill.includes(fingerprint));
    assert.match(skill,/Obligation Terminal Closure/);
    assert.match(skill,/LIVE_BEWEZEN/);
  }
  assert.match(delivery,/Production Release Readback/);
  assert.match(continuity,/writer-lease release/i);
});

test('documentation and ledger preserve production proof and reusable lesson', async()=>{
  const [docs,ledger]=await Promise.all([
    read('docs/brain/github-delivery-state-machine-v1.md'),
    read('docs/development-ledger.md')
  ]);
  for(const surface of [docs,ledger]){
    assert.match(surface,/PR #2166/);
    assert.ok(surface.includes(mergeSha));
    assert.match(surface,/35350501725/);
  }
  assert.match(ledger,/parallelize construction, serialize landing/i);
});
