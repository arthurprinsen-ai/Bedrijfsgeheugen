import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('deployment recovery is registered and fails closed when dispatch cannot be authorized',()=>{
 const agents=read('AGENTS.md');
 const skill=read('.agents/skills/deployment-capability-recovery/SKILL.md');
 assert.ok(agents.includes('.agents/skills/deployment-capability-recovery/SKILL.md'));
 for(const rule of ['DELIVERY_CONTROL_PLANE_CAPABILITY_GAP','BLOCKED_CONTROL_PLANE_CAPABILITY','published','No authorized write path','Required, CodeQL']){
  assert.ok(skill.toLowerCase().includes(rule.toLowerCase()),'missing safeguard: '+rule);
 }
 assert.match(skill,/no second scheduler/i);
 assert.match(skill,/Do not create a dummy commit/i);
 assert.match(skill,/No authorized write path/i);
});
