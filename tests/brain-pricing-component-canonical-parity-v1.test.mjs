import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('reusable pricing component stays aligned with canonical scan price',async()=>{
  const [component,pricing]=await Promise.all([
    readFile(new URL('../components/pricing/pricing.html',import.meta.url),'utf8'),
    readFile(new URL('../prijzen.html',import.meta.url),'utf8')
  ]);
  assert.match(component,/€ 2\.950/);
  assert.doesNotMatch(component,/€ 2\.900/);
  assert.doesNotMatch(component,/op afstand € 2\.400/i);
  assert.match(pricing,/Bedrijfsgeheugen Scan[\s\S]{0,1400}€ 2\.950/);
});
