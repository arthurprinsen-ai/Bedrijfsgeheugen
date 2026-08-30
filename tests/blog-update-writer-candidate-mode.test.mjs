import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const text=fs.readFileSync('.github/workflows/blog-bijwerken.yml','utf8');
test('blog updater is candidate-only under BRAIN v2',()=>{assert.match(text,/default:\s*candidate-pr/);assert.doesNotMatch(text,/default:\s*direct/);assert.doesNotMatch(text,/git push origin HEAD:main/);assert.match(text,/createWriterCandidate/);assert.match(text,/gh pr create/);});
test('blog updater does not mark Notion production state before production proof',()=>{assert.doesNotMatch(text,/Notion op Goedgekeurd zetten na succesvolle directe publicatie/);assert.doesNotMatch(text,/steps\.commit\.outputs\.delivery == 'direct'/);});
