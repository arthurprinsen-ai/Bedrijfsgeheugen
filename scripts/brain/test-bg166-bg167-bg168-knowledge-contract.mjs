import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));

test('BG168 keeps legacy inputs and adds universal event_json',()=>{
  const c=read('brain/contracts/bg168-knowledge-event-interface-v1.json');
  assert.ok(c.inputs.includes('event_json'));
  assert.ok(c.legacy_inputs.includes('agent_id'));
  assert.equal(c.materiality_owner,'BG168');
  assert.equal(c.legacy_compatibility_required,true);
});

test('BG166 preserves universal traceability and dedupes before downstream writes',()=>{
  const c=read('brain/contracts/bg166-knowledge-event-interface-v1.json');
  for(const field of ['event_id','source_refs','architecture_impact','outcome','readback']) assert.ok(c.preserve_fields.includes(field));
  assert.equal(c.dedupe_before_write,true);
  assert.equal(c.dedupe_before_bg167_refresh,true);
});

test('BG167 readback can prove event id or fingerprint without weakening refresh guard',()=>{
  const c=read('brain/contracts/bg167-knowledge-readback-interface-v1.json');
  assert.deepEqual(c.readback_keys,['event_id','fingerprint']);
  assert.equal(c.refresh_guard_unchanged,true);
  assert.ok(c.request_modes.includes('readback'));
});
