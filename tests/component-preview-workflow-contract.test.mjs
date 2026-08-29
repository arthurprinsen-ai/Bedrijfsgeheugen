import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('component preview workflow detects and fans out changed components', async () => {
  const workflow = await readFile('.github/workflows/component-preview.yml', 'utf8');
  assert.match(workflow, /detect-changed-components\.mjs/);
  assert.match(workflow, /strategy:\s*\n\s*matrix:/);
  assert.match(workflow, /fromJSON\(needs\.detect\.outputs\.components\)/);
  assert.match(workflow, /compose-component-preview\.mjs/);
});

test('component jobs test only their own component before preview composition', async () => {
  const workflow = await readFile('.github/workflows/component-preview.yml', 'utf8');
  assert.match(workflow, /tests\/components\/\$\{\{ matrix\.component \}\}\.test\.mjs/);
  assert.match(workflow, /preview\/components\/\$\{\{ matrix\.component \}\}\.html/);
});
