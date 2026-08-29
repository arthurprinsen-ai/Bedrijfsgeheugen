import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/component-integration-tdd.yml', 'utf8');

const componentTests = [
  'header','hero-copy','hero-video','hero-demo','social-proof','pricing','footer'
];

const foundationTests = [
  'parallel-ownership.test.mjs',
  'change-classes.test.mjs',
  'page-composition.test.mjs',
  'component-preview-composition.test.mjs',
  'component-boundaries.test.mjs',
  'detect-changed-components.test.mjs',
  'component-preview-workflow-contract.test.mjs'
];

test('integration workflow runs every isolated component contract', () => {
  for (const id of componentTests) {
    assert.ok(workflow.includes(`tests/components/${id}.test.mjs`), `missing ${id} component test`);
  }
});

test('integration workflow runs reusable architecture and preview gates', () => {
  for (const file of foundationTests) {
    assert.ok(workflow.includes(`tests/${file}`), `missing architecture gate ${file}`);
  }
  assert.ok(workflow.includes('tests/integration/component-integration.test.mjs'));
  assert.ok(workflow.includes('tests/integration/integration-workflow-contract.test.mjs'));
  assert.ok(workflow.includes('tests/integration/netlify-preview-contract.test.mjs'));
});

test('integration workflow composes and uploads the full homepage candidate', () => {
  assert.match(workflow, /node tools\/compose-home-migration\.mjs dist\/index\.html/);
  assert.match(workflow, /actions\/upload-artifact@v4/);
  assert.match(workflow, /name:\s*component-homepage-candidate/);
  assert.match(workflow, /path:\s*dist\/index\.html/);
});
