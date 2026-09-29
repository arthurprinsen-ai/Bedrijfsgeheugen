import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const skill=readFileSync('.agents/skills/linkedin-composio-publisher/SKILL.md','utf8');
const agents=readFileSync('AGENTS.md','utf8');
const map=readFileSync('platform/system-map/canonical-system-map.mjs','utf8');

test('LinkedIn company auth authority is production runtime, not chat-local connector state',()=>{
  for (const text of [skill,agents]) {
    assert.match(text,/linkedin-production-runtime-authority-over-chat-session-v1/);
    assert.match(text,/linkedin-composio-setup-current-state-v1/);
    assert.match(text,/provider_create_success/);
    assert.match(text,/republish_forbidden/);
  }
  assert.match(skill,/chat-local Composio connection list is diagnostic only/i);
  assert.match(skill,/human OAuth request is allowed only when the production runtime itself lacks/i);
});

test('system map exposes the LinkedIn production auth authority',()=>{
  assert.match(map,/linkedin-production-auth-authority/);
  assert.match(map,/urn:li:organization:18234216/);
  assert.match(map,/chatLocalConnectorIsDiagnosticOnly:true/);
  assert.match(map,/providerUrnBlocksRepublish:true/);
});
