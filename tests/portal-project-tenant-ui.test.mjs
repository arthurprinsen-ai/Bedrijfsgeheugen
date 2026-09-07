import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const navigation=await readFile(new URL('../portal-next/portal-navigation-complete.js',import.meta.url),'utf8');

test('Portal Next toont tenant-configuratie als expliciete blocker en niet als lege projectdata',()=>{
  assert.match(navigation,/tenant-unconfigured/);
  assert.match(navigation,/Tenantkoppeling ontbreekt/);
  assert.match(navigation,/beheerder/);
});
