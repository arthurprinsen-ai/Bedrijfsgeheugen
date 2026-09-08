import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const AGENTS_PATH = new URL('../AGENTS.md', import.meta.url);

test('AGENTS delivery synchronization rule includes semantic contract overlap', async () => {
  const agents = await readFile(AGENTS_PATH, 'utf8');

  assert.match(
    agents,
    /mergeconflict, changed-path overlap, declared contract overlap of declared dependency conflict vereist synchronisatie/,
    'AGENTS.md must mirror BRAIN-DELIVERY-v2 syncRequiredWhen, including declared semantic contract overlap',
  );
});

test('AGENTS forbids treating running CI or missing production readback as completion', async () => {
  const agents = await readFile(AGENTS_PATH, 'utf8');

  assert.match(
    agents,
    /queued, pending, in_progress, een rode check, een open PR, merge-wachtstatus, deploy in progress of ontbrekende productie-readback is nooit terminaal/,
    'running CI/deploy states must be explicitly non-terminal',
  );
  assert.match(
    agents,
    /PRODUCTION_GREEN\/LIVE_VERIFIED/,
    'production completion must require exact live verification',
  );
  assert.match(
    agents,
    /BLOCKED_HARD_BOUNDARY/,
    'only a genuine hard boundary may terminate unresolved work',
  );
  assert.match(
    agents,
    /preview inhoudelijk gecontroleerd.*gates groen.*PR gemerged.*exacte productie-SHA.*live productie-readback/s,
    'the complete delivery chain must be stated explicitly',
  );
});
