import './delivery-ci-adaptive-pr-planner.test.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('single established Recovery Supervisor owns priority, CAS and scheduler',()=>{
 const yaml=readFileSync('.github/workflows/powerhouse-delivery-recovery-supervisor.yml','utf8');
 assert.match(yaml,/tools\/delivery\/recovery-pr-prioritizer\.mjs/);
 assert.doesNotMatch(yaml,/ci-adaptive-pr-planner\.mjs --rank/);
 assert.match(yaml,/expected_head_sha/);
 assert.match(yaml,/MAX_MAIN_DRIFT_REFRESHES/);
});
