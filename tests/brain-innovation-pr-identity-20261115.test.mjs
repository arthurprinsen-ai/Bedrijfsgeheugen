import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isOriginalCodeImplementationPr} from '../scripts/brain/innovation-original-code-delivery.mjs';

const identity={
  candidate_id:'7ae7a817-5900-41df-bf7c-d127e8336b13',
  operation_id:'b37f9278-6c04-49d0-8424-4517a538aabb',
  source_revision:'source-rev-20261115',
  source_sha256:'a'.repeat(64)
};
const body=`Parent-P0: #4198
Delivery-Lane: backend
Candidate-Type: implementation
Original-Candidate: ${identity.candidate_id}
Original-Operation: ${identity.operation_id}
Original-Source-Revision: ${identity.source_revision}
Original-Source-SHA256: ${identity.source_sha256}`;
const pr=(changes={})=>({state:'OPEN',mergedAt:null,baseRefName:'main',body,...changes});

test('incident PR containing the candidate UUID is NOT a protected implementation receipt',()=>{
  const incident=`Parent-P0: #4198
Candidate-Type: recovery
Original candidate ${identity.candidate_id} was inspected and returned zero source changes.
Original code work remains unverified.`;
  assert.equal(isOriginalCodeImplementationPr(pr({body:incident}),identity),false);
  const actualReadback=readFileSync('scripts/brain/innovation-original-code-delivery.mjs','utf8');
  assert.doesNotMatch(actualReadback,/pr=>typeof pr\.body==='string'&&pr\.body\.includes\(id\)/);
  assert.match(actualReadback,/isOriginalCodeImplementationPr\(pr,identity\)/);
});

test('only the exact source-bound open implementation PR blocks duplicate generation',()=>{
  assert.equal(isOriginalCodeImplementationPr(pr(),identity),true);
  assert.equal(isOriginalCodeImplementationPr(pr({state:'MERGED',mergedAt:'2026-11-15T19:50:00Z'}),identity),true);
  assert.equal(isOriginalCodeImplementationPr(pr({state:'CLOSED'}),identity),false);
  assert.equal(isOriginalCodeImplementationPr(pr({state:'OPEN',baseRefName:'some-other-branch'}),identity),false);
});

test('candidate, operation, source revision and SHA all must match the ORIGINAL work order',()=>{
  for(const key of Object.keys(identity)){
    const wrong={...identity,[key]:'WRONG_SOURCE'};
    assert.equal(isOriginalCodeImplementationPr(pr(),wrong),false,key);
  }
  assert.equal(isOriginalCodeImplementationPr(pr({body:body+'\nOriginal-Candidate: '+identity.candidate_id}),identity),false);
  assert.equal(isOriginalCodeImplementationPr(pr({body:body.replace('Candidate-Type: implementation','Candidate-Type: recovery')}),identity),false);
  assert.equal(isOriginalCodeImplementationPr(pr({body:'Incident: '+identity.candidate_id}),identity),false);
});

test('one original implementation contract can be replayed after canonical CRLF formatting',()=>{
  assert.equal(isOriginalCodeImplementationPr(pr({body:body.replaceAll('\n','\r\n')}),identity),true);
});
