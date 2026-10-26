import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const matrix=JSON.parse(await readFile(new URL('../platform/assurance/one-brain-coverage-v1.json',import.meta.url),'utf8'));
test('one-brain gate coverage is complete, unique and fails closed',()=>{
 const expected=['sources','impact','recommendations','execution','outcomes','content','portal','assurance'];
 assert.deepEqual(matrix.gates.map(g=>g.id).sort(),expected.sort());
 assert.equal(new Set(matrix.gates.map(g=>g.id)).size,expected.length);
 for(const gate of matrix.gates){
  assert.ok(['UNVERIFIED','PARTIAL','PROVEN'].includes(gate.status));
  if(gate.status==='PROVEN'){
   assert.ok(gate.evidence?.length>0,'PROVEN requires evidence');
   assert.ok(gate.proof,'PROVEN requires proof identifier');
  }
 }
 assert.equal(matrix.status==='GREEN',matrix.gates.every(g=>g.status==='PROVEN'));
});
