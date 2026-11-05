import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow=readFileSync('.github/workflows/lane-backend.yml','utf8');
test('original backend contract lane installs JS dependencies without unrelated FFmpeg postinstall download',()=>{
  assert.match(workflow,/npm install --ignore-scripts --prefer-offline --no-audit --no-fund/);
  assert.doesNotMatch(workflow,/run: npm install --prefer-offline --no-audit --no-fund/);
  assert.match(workflow,/Install runtime dependencies for backend contracts/);
  assert.match(workflow,/timeout-minutes: 8/);
});
test('original backend Brain tests, error contracts and quality gates stay mandatory',()=>{
  for(const path of ['tests/brain-adapter-conformance.test.mjs','tests/brain-error-learning-contract.test.mjs',
    'tests/brain-quality-intelligence.test.mjs','tests/supabase-instagram-media-job-materializer-v1.test.mjs',
    'tests/regulatory-organism-feed.test.mjs','scripts/brain/powerhouse-quality-intelligence.mjs --check']){
    assert.ok(workflow.includes(path),path);
  }
  assert.doesNotMatch(workflow,/continue-on-error: true|if: always\(\) && success\(\)/);
});
test('systemic backend ffmpeg failure uses original ONE BRAIN fingerprint and remains not live until provider run',()=>{
  const x=JSON.parse(readFileSync('brain/learning/2026-11-05-backend-ffmpeg-postinstall-http-504.json','utf8'));
  assert.equal(x.compiler.machine_enforceable,true);
  assert.equal(x.production_readback,'EVIDENCE_DUE');
  assert.equal(x.status,'CODE_CANDIDATE_UNVERIFIED');
  assert.ok(x.evaluation.historical_replay.includes('tests/brain-backend-ffmpeg-prerequisite-prevention-20261105.test.mjs'));
});
