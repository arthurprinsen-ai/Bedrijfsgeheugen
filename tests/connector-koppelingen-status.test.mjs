import test from 'node:test';
import assert from 'node:assert/strict';
import {toHumanStatus} from '../assets/js/koppelingen/status.js';

test('not configured is never shown active',()=>{
  const s=toHumanStatus({state:'not-configured'});
  assert.equal(s.label,'Verbinding ontbreekt');
  assert.equal(s.canActivate,false);
});

test('configured without evidence is only ready to test',()=>{
  const s=toHumanStatus({state:'configured'});
  assert.equal(s.label,'Klaar om te testen');
  assert.equal(s.canActivate,false);
});

test('activation requires successful safe-test evidence with an id',()=>{
  const s=toHumanStatus({state:'ready',lastSafeTest:{ok:true,executionId:'ex-1'}});
  assert.equal(s.label,'Test geslaagd');
  assert.equal(s.canActivate,true);
  const missingId=toHumanStatus({state:'ready',lastSafeTest:{ok:true}});
  assert.equal(missingId.canActivate,false);
});

test('healthy requires real execution evidence',()=>{
  const healthy=toHumanStatus({state:'healthy',lastExecution:{ok:true,executionId:'live-1'}});
  assert.equal(healthy.label,'Actief en gezond');
  const unproven=toHumanStatus({state:'healthy'});
  assert.notEqual(unproven.label,'Actief en gezond');
});

test('degraded and error states always require action',()=>{
  for(const state of ['degraded','error']){
    const s=toHumanStatus({state});
    assert.equal(s.label,'Actie nodig');
    assert.equal(s.canActivate,false);
  }
});
