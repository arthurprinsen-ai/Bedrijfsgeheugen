import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const yml=fs.readFileSync('.github/workflows/paginacontrole.yml','utf8');
test('paginacontrole validates changes to its own workflow source',()=>{
  const hits=(yml.match(/'\.github\/workflows\/paginacontrole\.yml'/g)||[]).length;
  assert.equal(hits,2,'push and pull_request path filters must both include the workflow itself');
});