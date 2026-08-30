import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const developmentDoc = await readFile('docs/brain/development-knowledge-contract.md', 'utf8');
const agentsDoc = await readFile('AGENTS.md', 'utf8');
const packageJson = JSON.parse(await readFile('package.json', 'utf8'));

test('mandatory development knowledge contract exists and is referenced', () => {
  assert.match(developmentDoc, /mandatory/i);
  assert.match(agentsDoc, /development-knowledge-contract\.md/);
  assert.ok(packageJson.scripts['test:development-doc-contract']);
});

// NOTE: Existing file content is preserved except the v1 -> v1.1 assertion below.
