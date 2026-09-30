import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [agents,skill,contractText]=await Promise.all([
  readFile('AGENTS.md','utf8'),
  readFile('.agents/skills/powerhouse-continuity/SKILL.md','utf8'),
  readFile('config/powerhouse-execution-resilience-v1.json','utf8')
]);
const contract=JSON.parse(contractText);

test('stream interruption is checkpointed and resumable',()=>{
  assert.match(agents,/powerhouse\|chat-stream-resilience\|bounded-checkpointed-resume\|v1/);
  assert.match(skill,/bounded idempotent batches/i);
  assert.equal(contract.chat_stream_resilience?.required,true);
  assert.equal(contract.chat_stream_resilience?.strategy,'BOUNDED_CHECKPOINTED_EXECUTION');
});

test('stream loss never requires blind replay or user continue',()=>{
  const req=new Set(contract.chat_stream_resilience?.requirements||[]);
  assert.equal(req.has('read back uncertain side effects before replay'),true);
  assert.equal(req.has('resume only remaining delta'),true);
  assert.match(contract.chat_stream_resilience?.requirements?.join(' ')||'',/do not require the user to repeat continue/i);
  assert.match(skill,/read back uncertain side effects before replay/i);
});
