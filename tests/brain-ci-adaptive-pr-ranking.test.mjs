import './delivery-ci-adaptive-pr-planner.test.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('existing supervisor retains single-run and protected release authority',()=>{
 const source=readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
 assert.match(source,/ci-adaptive-pr-planner\.mjs --rank/);
 assert.match(source,/MAX_MAIN_DRIFT_REFRESHES/);
 assert.match(source,/expected_head_sha/);
 assert.match(source,/if dispatch_required; then did_recover=1; fi/);
});
