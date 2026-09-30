import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const skill=fs.readFileSync('skills/powerhouse-commercial-outbound-self-heal.md','utf8');
const agents=fs.readFileSync('AGENTS.md','utf8');
const map=fs.readFileSync('platform/system-map/canonical-system-map.mjs','utf8');

test('commercial outbound transport errors remain recoverable and structured',()=>{
  assert.match(skill,/herstelbare transport- of connectorfout mag nooit.*error/i);
  assert.match(skill,/\[object Object\].*escaped defect/i);
  assert.match(agents,/herstelbare connector-\/transportfouten zijn nooit terminale .*error/i);
});

test('provider project consistency is mandatory before outbound write',()=>{
  assert.match(skill,/provider-project-consistentie/i);
  assert.match(skill,/raw Composio API connected-account nanoid/i);
  assert.match(map,/sameProviderProjectRequired:true/);
  assert.match(map,/directExecuteRequiresEntityIdentity:true/);
});

test('recovery preserves commercial guards and provider readback',()=>{
  assert.match(map,/recoverableTransportErrorTerminal:false/);
  assert.match(map,/providerMessageThreadReadbackRequired:true/);
  for(const guard of ['daily-send-cap','suppression','cooldown','consent-or-existing-relationship','dedupe','republish-forbidden']){
    assert.match(map,new RegExp(guard));
  }
});

test('LinkedIn DM remains fail closed without a true send capability',()=>{
  assert.match(skill,/LinkedIn-DM is fail-closed/i);
  assert.match(map,/failClosedWithoutTrueSendCapability:true/);
  assert.match(map,/postOrCommentIsDm:false/);
});
