import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile(new URL('../.github/workflows/powerhouse-obligation-terminalizer.yml', import.meta.url), 'utf8');

test('terminalizer never hardcodes runtime or outcome evidence to true', () => {
  assert.doesNotMatch(workflow, /runtime_function_readback:\s*true/);
  assert.doesNotMatch(workflow, /outcome_evidence:\s*true/);
  assert.match(workflow, /POST_MERGE_RUNTIME_READBACK_NOT_PROVEN/);
  assert.match(workflow, /RUNTIME_FUNCTION_READBACK_NOT_PROVEN/);
  assert.match(workflow, /OUTCOME_EVIDENCE_NOT_PROVEN/);
});

test('non-runtime changes are explicit not-applicable, never fabricated runtime proof', () => {
  assert.match(workflow, /runtime_readback=not_applicable/);
  assert.match(workflow, /outcome_evidence=not_applicable/);
});
