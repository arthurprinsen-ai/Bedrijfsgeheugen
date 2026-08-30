import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const w=fs.readFileSync('.github/workflows/blog-bijwerken.yml','utf8');
test('blog updater is candidate-only',()=>{assert.match(w,/default:\s*candidate-pr/);assert.doesNotMatch(w,/HEAD:main/);assert.match(w,/createWriterCandidate/);assert.match(w,/gh pr create/);});
test('blog updater does not mark Notion completed before production reconciliation',()=>assert.doesNotMatch(w,/Notion op Goedgekeurd zetten na succesvolle directe publicatie/));
