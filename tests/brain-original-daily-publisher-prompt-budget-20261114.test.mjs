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
 for(const marker of ['original #120 Mira','#140 content/Heartbeat',
   '#171 BRAIN','Gmail #116','six business/two personal',
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

test('original prevention is documented with a sanitized bounded learning record and no leaked task prompt',()=>{
 const meta=JSON.parse(readFileSync('brain/learning/2026-11-14-original-daily-publisher-prompt-bounded-current-v1.json','utf8'));
 const human=readFileSync('docs/changes/2026-11-14-original-daily-publisher-current-prompt-budget.md','utf8');
 const ledger=readFileSync('docs/development-ledger-events/2026-11-14-original-daily-publisher-prompt-budget.md','utf8');
 assert.equal(meta.production_readback.same_existing_task,true);
 assert.equal(meta.production_readback.local_schedule_unchanged,true);
 assert.equal(meta.production_readback.enabled,true);
 assert.equal(meta.production_readback.original_prompt_characters,129285);
 assert.equal(meta.production_readback.consolidated_prompt_characters,13019);
 assert.match(human,/PROCESSED/);
 assert.match(ledger,/No raw task instructions/);
 assert.equal(JSON.stringify(meta).includes('service_role'),false);
 assert.equal(JSON.stringify(meta).includes('Bearer '),false);
});
