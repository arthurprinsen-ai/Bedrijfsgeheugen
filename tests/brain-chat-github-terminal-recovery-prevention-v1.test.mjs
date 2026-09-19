import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('chat GitHub terminal recovery learning is canonically recorded and skill-targeted', async()=>{
  const learning=JSON.parse(await readFile('brain/learning/2026-09-19-chat-github-terminal-recovery-prevention-v1.json','utf8'));
  assert.equal(learning.fingerprint,'github|chat-terminal-recovery|exact-head-observability|v1');
  assert.deepEqual(new Set(learning.skill_targets),new Set([
    'powerhouse-continuity',
    'powerhouse-delivery-concurrency',
    'powerhouse-delivery-self-optimization'
  ]));
  assert.match(learning.prevention.join('\n'),/production_observed_sha === main_sha/);
  assert.match(learning.prevention.join('\n'),/sanitized response body/);
  assert.match(learning.prevention.join('\n'),/process substitution/);
});

test('skills prevent transient-equal reconciliation auto-close', async()=>{
  for(const path of ['.agents/skills/powerhouse-delivery-concurrency/SKILL.md','.agents/skills/powerhouse-delivery-self-optimization/SKILL.md']){
    const text=await readFile(path,'utf8');
    assert.match(text,/transient state|transient equality/i);
    assert.match(text,/full current-main tree|current-main-union/i);
    assert.match(text,/atomically/i);
  }
});

test('durable skill surfaces carry terminal recovery prevention rules', async()=>{
  const paths=[
    '.agents/skills/powerhouse-continuity/SKILL.md',
    '.agents/skills/powerhouse-delivery-concurrency/SKILL.md',
    '.agents/skills/powerhouse-delivery-self-optimization/SKILL.md'
  ];
  for(const path of paths){
    const text=await readFile(path,'utf8');
    assert.match(text,/github\|chat-terminal-recovery\|exact-head-observability\|v1/);
    assert.match(text,/status/s);
    assert.match(text,/response body/s);
    assert.match(text,/observed SHA|production_observed_sha/s);
    assert.match(text,/main_sha/s);
    assert.match(text,/equal|===/s);
  }
});

test('tree reconciliation requires verified base tree and bounded diff', async()=>{
  const learning=JSON.parse(await readFile('brain/learning/2026-09-19-chat-github-terminal-recovery-prevention-v1.json','utf8'));
  const prevention=learning.prevention.join('\n');
  assert.match(prevention,/base_tree_sha/);
  assert.match(prevention,/current main commit|current-main parent/);
  assert.match(prevention,/diff-size|changed-file\/deletion budgets/);
  assert.match(prevention,/fails closed|fail-closed/);
});
