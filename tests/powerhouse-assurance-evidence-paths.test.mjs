import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(root,'powerhouse/assurance/portal-v2-parity.json'),'utf8'));

test('Portal V2 parity evidence references real repository files',()=>{
  const missing=[];
  for(const capability of manifest.capabilities||[]){
    for(const evidencePath of capability.tests||[]){
      if(!/\.(?:js|mjs|py|json|md)$/.test(evidencePath))continue;
      if(!fs.existsSync(path.join(root,evidencePath)))missing.push(`${capability.legacy_key}:${evidencePath}`);
    }
  }
  assert.deepEqual(missing,[],`assurance evidence must not point at missing files: ${missing.join(', ')}`);
});
