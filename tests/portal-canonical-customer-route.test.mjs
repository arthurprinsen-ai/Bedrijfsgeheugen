import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const redirects=readFileSync(new URL('../_redirects',import.meta.url),'utf8');

test('normale klantportaal-slugs gaan met redirect naar de tenant-aware portal',()=>{
  assert.match(redirects,/\/klantportaal\s+klant=:klant\s+\/portal\/\s+302!/);
  assert.doesNotMatch(redirects,/\/klantportaal\s+klant=:klant\s+\/klantportaal\.html\s+200!/);
});

test('ijsselmonde gebruikt dezelfde canonical portalroute',()=>{
  assert.match(redirects,/\/klantportaal\s+klant=ijsselmonde\s+\/portal\/\s+302!/);
});

test('demo1 blijft bewust op de afzonderlijke demo',()=>{
  assert.match(redirects,/\/klantportaal\s+klant=demo1\s+\/klantportaal-demo\.html\s+200!/);
});
