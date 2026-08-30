import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const text=fs.readFileSync('.github/workflows/paginacontrole.yml','utf8');
test('automatic and manual page-control repairs are candidate-only under BRAIN v2',()=>{assert.match(text,/default:\s*candidate-pr/);assert.doesNotMatch(text,/default:\s*direct/);assert.doesNotMatch(text,/git push origin HEAD:main/);assert.doesNotMatch(text,/DELIVERY_MODE" = "direct/);assert.match(text,/createWriterCandidate/);assert.match(text,/gh pr create/);assert.match(text,/github\.event_name != 'pull_request'/);});
test('page-control candidate never self-merges',()=>{assert.doesNotMatch(text,/gh\s+pr\s+merge/);});
