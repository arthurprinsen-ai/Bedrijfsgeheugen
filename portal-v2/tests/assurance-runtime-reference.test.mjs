import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'../..');

test('canvassen assurance implementation evidence exists in executable runtime',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'powerhouse/assurance/portal-v2-parity.json'),'utf8'));
  const canvassen=manifest.capabilities.find(item=>item.legacy_key==='canvassen');
  assert.ok(['implemented','verified'].includes(canvassen?.status),`unexpected canvassen lifecycle status: ${canvassen?.status}`);
  for(const reference of canvassen.tests||[]){
    if(reference.startsWith('portal-v2/'))assert.equal(fs.existsSync(path.join(root,reference)),true,`missing assurance runtime evidence: ${reference}`);
  }
});
