import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';

const required = [
  'AGENTS.md',
  'docs/development-operating-system.md',
  'docs/development-ledger.md',
  'docs/self-healing-agents.md',
  'docs/superpowers/specs/2026-08-28-shared-agent-memory-design.md'
];

test('mandatory development knowledge contract exists and is referenced', async () => {
  for (const path of required) await access(path);
  const agents = await readFile('AGENTS.md', 'utf8');
  for (const path of required.slice(1)) {
    assert.match(agents, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('ledger contains material outcome vocabulary', async () => {
  const ledger = await readFile('docs/development-ledger.md', 'utf8');
  for (const token of ['ERROR','RECOVERY','IMPROVEMENT','PRODUCTION_PROMOTION','PRODUCTION_ROLLBACK']) {
    assert.ok(ledger.includes(token), `ledger missing ${token}`);
  }
});
