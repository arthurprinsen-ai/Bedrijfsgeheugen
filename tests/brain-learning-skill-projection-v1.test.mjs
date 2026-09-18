import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildSkillProjectionIndex, verifySkillProjectionIndex, selectSkillProjection } from '../scripts/brain/powerhouse-skill-projection.mjs';
import { compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

test('canonical learning projection deduplicates by fingerprint',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ph-skill-projection-'));
  try{
    fs.mkdirSync(path.join(root,'brain','learning'),{recursive:true});
    fs.writeFileSync(path.join(root,'brain','learning','a.json'),JSON.stringify({fingerprint:'alpha-v1',status:'ACTIVE',prevention:['Reuse canonical state first'],skill_targets:['continuity']}));
    fs.writeFileSync(path.join(root,'brain','learning','b.json'),JSON.stringify({fingerprint:'alpha-v1',status:'ACTIVE',prevention:['Reuse canonical state first'],skill_targets:['continuity']}));
    const index=buildSkillProjectionIndex({rootDir:root});
    assert.equal(index.entries.length,1);
    assert.equal(index.entries[0].fingerprint,'alpha-v1');
    assert.match(index.entries[0].source_digest,/^[a-f0-9]{64}$/);
    assert.equal(verifySkillProjectionIndex({rootDir:root,index}).ok,true);
    index.entries[0].source_digest='0'.repeat(64);
    assert.equal(verifySkillProjectionIndex({rootDir:root,index}).ok,false);
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});

test('current repository backfills terminal delivery learning',()=>{
  const index=buildSkillProjectionIndex({rootDir:process.cwd()});
  assert.ok(index.entries.some(e=>e.fingerprint==='powerhouse-terminal-delivery-consolidation-2026-09-18-v1'));
  assert.ok(index.entries.some(e=>e.fingerprint==='powerhouse-learning-skill-auto-projection-v1'));
});

test('mandatory chat preflight reads back skill projection',()=>{
  const packet=compileChatLearningPreflight({executionContext:{intent:'verify terminal delivery learning',relevantLearningFingerprints:['powerhouse-terminal-delivery-consolidation-2026-09-18-v1'],deliveryLanes:['delivery']}});
  assert.equal(packet.skill_projection.status,'READY');
  assert.equal(packet.skill_projection.fingerprint,'powerhouse-learning-skill-auto-projection-v1');
  assert.match(packet.skill_projection.projection_digest,/^[a-f0-9]{64}$/);
  assert.ok(packet.skill_projection.entry_count>0);
  assert.equal(packet.skill_projection.verification.ok,true);
  assert.ok(packet.skill_projection.selection.selected_entries.some(e=>e.fingerprint==='powerhouse-terminal-delivery-consolidation-2026-09-18-v1'));
});

test('selection is bounded when task hints are absent',()=>{
  const index=buildSkillProjectionIndex({rootDir:process.cwd()});
  const none=selectSkillProjection(index,{});
  assert.equal(none.selection_mode,'SUMMARY_ONLY_NO_TASK_HINTS');
  assert.deepEqual(none.selected_entries,[]);
});
