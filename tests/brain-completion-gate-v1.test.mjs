import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const path='brain/contracts/completion-gate-v1.json';
const required=['registered','tested','exactPromoted','productionIdentityVerified','runtimeBusinessOutcomeVerified','learningPersisted','sharedStateRefreshed'];

test('completion gate requires the full canonical DoD',()=>{
  assert.equal(fs.existsSync(path),true,'completion gate contract must exist');
  const c=JSON.parse(fs.readFileSync(path,'utf8'));
  assert.equal(c.version,'COMPLETION-GATE-v1');
  assert.equal(c.failClosed,true);
  for(const stage of required) assert.equal(c.requiredStages.includes(stage),true,`missing ${stage}`);
});

test('merge, CI, 2xx and parent dispatch are explicitly non-terminal',()=>{
  const c=JSON.parse(fs.readFileSync(path,'utf8'));
  for(const x of ['mergeOnly','ciOnly','http2xxOnly','parentDispatchOnly']) assert.equal(c.rejectedProofs.includes(x),true,`missing rejection ${x}`);
  assert.equal(c.learningProof.downstreamPersistenceRequired,true);
  assert.equal(c.learningProof.parentDispatchSuccessSufficient,false);
  assert.equal(c.sharedStateProof.refreshOrCoalescedReadbackRequired,true);
});
