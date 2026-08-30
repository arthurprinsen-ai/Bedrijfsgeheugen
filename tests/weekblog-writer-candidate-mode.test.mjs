import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const w=fs.readFileSync('.github/workflows/weekblog.yml','utf8');
test('weekblog is candidate-only',()=>{assert.match(w,/default:\s*candidate-pr/);assert.doesNotMatch(w,/HEAD:main/);assert.match(w,/createWriterCandidate/);assert.match(w,/gh pr create/);});
test('weekblog does not mark Notion published before production reconciliation',()=>assert.doesNotMatch(w,/Notion bijwerken na succesvolle directe publicatie/));
