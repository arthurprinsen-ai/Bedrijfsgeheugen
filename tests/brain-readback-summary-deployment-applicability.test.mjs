import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('existing readback workflow exposes deployment classification in GitHub summary without claiming live',()=>{
 const workflow=readFileSync(new URL('../.github/workflows/production-release-readback.yml',import.meta.url),'utf8');
 assert.match(workflow,/GITHUB_STEP_SUMMARY/);
 assert.match(workflow,/Status: \*\*\$\{deployEvidence.status\}\*\*/);
 assert.match(workflow,/Runtime\/website proof: \*\*not inferred from applicability\*\*/);
 assert.match(workflow,/paths-ignore:/);
});
