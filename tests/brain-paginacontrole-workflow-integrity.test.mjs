import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const yml=fs.readFileSync('.github/workflows/paginacontrole.yml','utf8');
test('paginacontrole workflow has one canonical terminal tail',()=>{
  assert.equal((yml.match(/name: Pagina- en SEO-controle/g)||[]).length,1);
  assert.equal((yml.match(/- name: Falen doorgeven/g)||[]).length,1);
  assert.equal((yml.match(/jobs:\n  controle:/g)||[]).length,1);
  assert.ok(yml.trimEnd().endsWith('exit 1'));
  assert.ok(yml.length < 20000);
});