import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const yml=fs.readFileSync('.github/workflows/paginacontrole.yml','utf8');
test('paginacontrole validates changes to its own workflow source',()=>{
  const hits=(yml.match(/'\.github\/workflows\/paginacontrole\.yml'/g)||[]).length;
  // PR validation is owned by the candidate-PR delivery system; the main push filter must include the workflow itself.
  assert.equal(hits,1,'push path filter must include the workflow itself');
  assert.doesNotMatch(yml,/\n  pull_request:/);
});