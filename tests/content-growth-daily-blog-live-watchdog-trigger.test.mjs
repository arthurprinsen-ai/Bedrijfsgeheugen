import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const workflow = fs.readFileSync('.github/workflows/daily-blog-live-watchdog.yml', 'utf8');

test('daily blog live watchdog retriggers when canonical ledger changes on main', () => {
  assert.match(workflow, /push:\s*\n\s*branches:\s*\[main\]\s*\n\s*paths:\s*\n\s*- ['"]data\/content-publication-ledger\.json['"]/m);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /workflow_dispatch:/);
});
