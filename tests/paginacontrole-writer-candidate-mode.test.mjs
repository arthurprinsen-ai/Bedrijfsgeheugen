import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const w=fs.readFileSync('.github/workflows/paginacontrole.yml','utf8');
test('paginacontrole is candidate-only for repository repair',()=>{assert.match(w,/default:\s*candidate-pr/);assert.doesNotMatch(w,/HEAD:main/);assert.match(w,/createWriterCandidate/);assert.match(w,/gh pr create/);});
test('candidate preparation does not mutate production issue state',()=>assert.doesNotMatch(w,/inputs\.delivery_mode != 'candidate-pr'/));
