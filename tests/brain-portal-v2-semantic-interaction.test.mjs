import test from 'node:test';
import assert from 'node:assert/strict';
import { semanticLabel } from '../portal-v2/nextgen-intelligence.js';

test('portal semantic interaction preserves explicit visual meaning',()=>{
  assert.equal(semanticLabel({title:'Omzet: € 240.000',aria:'fallback'}),'Omzet: € 240.000');
  assert.equal(semanticLabel({aria:'Risico hoog'}),'Risico hoog');
  assert.equal(semanticLabel({}),'Datapunt');
});

test('portal semantic interaction bounds derived labels',()=>{
  assert.ok(semanticLabel({text:'x'.repeat(400)}).length<=180);
});
