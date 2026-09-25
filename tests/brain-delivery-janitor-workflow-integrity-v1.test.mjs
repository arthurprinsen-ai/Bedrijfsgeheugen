import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const janitor=fs.readFileSync(new URL('../.github/workflows/powerhouse-repository-janitor.yml', import.meta.url),'utf8');
const drain=fs.readFileSync(new URL('../.github/workflows/powerhouse-stale-actions-drain.yml', import.meta.url),'utf8');

test('repository janitor keeps its canonical cleanup/readback tail',()=>{
  assert.equal((janitor.match(/name: Reconcile stale Actions and merged branch debris/g)||[]).length,1);
  assert.equal((janitor.match(/name: Read back applied cleanup/g)||[]).length,1);
  assert.equal((janitor.match(/name: Upload janitor evidence/g)||[]).length,1);
});

test('fast stale Actions drainage is isolated from PR and terminal-lease classification failures',()=>{
  assert.match(drain,/name: Drain proven obsolete Actions runs/);
  assert.doesNotMatch(drain,/planRepositoryCleanup|TERMINAL_DELIVERY_CLOSED_UNMERGED_NO_SUCCESSOR/);
  assert.match(drain,/timeout-minutes:\s*8/);
});

test('full janitor remains a slower safety net while fast drainage has independent cadence',()=>{
  assert.match(janitor,/cron: '17 \* \* \* \*'/);
  assert.match(drain,/cron: '\*\/10 \* \* \* \*'/);
});
