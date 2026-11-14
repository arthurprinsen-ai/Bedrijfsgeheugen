import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const agents=readFileSync('platform/agents/agent-team.mjs','utf8');
const skill=readFileSync('.agents/skills/powerhouse-social-recovery-cooperation/SKILL.md','utf8');

test('original recovery agent owns bounded prompt stability, not a new executor',()=>{
 assert.match(agents,/id:'agent-social-delivery-recovery'/);
 assert.match(agents,/keep-existing-daily-publisher-prompt-bounded-current-and-nonduplicated/);
 assert.match(agents,/never-silently-drop-original-due-obligations-on-null-cas-or-receiver-conflict/);
 assert.match(skill,/the actual existing task by ID/i);
 assert.match(skill,/original title, task ID, enabled state, exact schedule and timezone unchanged/i);
 assert.match(skill,/<=16,000 characters/);
 assert.match(skill,/No new background task or chat-specific manual executor/);
});
test('all original source, provider, security, Brain Heartbeat and receiver gates stay mandatory',()=>{
 for(const marker of ['original #120 Mira','original #140 content/Heartbeat',
   'original #171 BRAIN','Gmail #116','six business/two personal',
   'LinkedIn company/personal','Instagram business-only','blog',
   'original named consumer processed ACK','PRIVATE','>=0.940',
   '>=0.900','independent numeric provider ID/permalink']){
   assert.ok(skill.toLowerCase().includes(marker.toLowerCase()),marker);
 }
 assert.match(skill,/A prompt update is deployment of operating instructions, NOT proof/);
 assert.match(skill,/without copying internal prompt text, tokens, private draft/);
 assert.match(skill,/Historical outcome reports belong with their original dated incident owners/);
 assert.match(skill,/never as competing live execution directives/);
});
