import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const REQUIRED = [
  'NO SILENT FAILURE',
  'NO LOST OBLIGATION',
  'GREEN MEANS OUTCOME VERIFIED',
  'EXPECTED',
  'ATTEMPTED',
  'VERIFIED',
  'COMPLETED',
  'idempotency_key',
  'verification_rule',
  'next_safe_action',
  'BG184',
  'BG156',
  'BG165',
  'BG168',
  'BG166',
  'BG167',
  'BG169'
];

test('whole-brain obligation contract is machine enforced', async () => {
  const contract = await readFile('docs/outcome-obligations.md', 'utf8');
  for (const token of REQUIRED) assert.ok(contract.includes(token), `missing ${token}`);
  assert.match(contract, /zero[- ](?:candidate|work|output)[\s\S]{0,160}RED/is);
  assert.match(contract, /COMPLETED[\s\S]{0,240}verification/i);
});

test('operating contracts reference the obligation contract', async () => {
  for (const path of ['docs/development-operating-system.md', 'docs/self-healing-agents.md']) {
    const text = await readFile(path, 'utf8');
    assert.ok(text.includes('docs/outcome-obligations.md'), `${path} missing obligation contract`);
  }
});
