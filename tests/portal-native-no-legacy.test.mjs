import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const files=['portal-next/portal-navigation-complete.js','portal-next/portal-navigation-complete.css','portal-next/portal-project-views.js'];
const banned=['native-legacy-frame','data-open-legacy','activateEmbeddedLegacyPage','styleLegacyDocument','/klantportaal.html'];

test('Portal Next project frontend bevat geen zichtbare legacy bridge',async()=>{
  for(const file of files){
    const source=await readFile(new URL(`../${file}`,import.meta.url),'utf8');
    for(const token of banned)assert.equal(source.includes(token),false,`${file} contains ${token}`);
  }
});
