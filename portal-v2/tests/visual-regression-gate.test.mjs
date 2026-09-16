import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflowUrl = new URL('../../.github/workflows/portal-v2-production-dom-readback.yml', import.meta.url);
const visualSpecUrl = new URL('../../tests/integration/portal-v2-production-visual-regression.spec.js', import.meta.url);
const workflow = await readFile(workflowUrl, 'utf8');

async function readVisualSpec() {
  try {
    return await readFile(visualSpecUrl, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return '';
    throw error;
  }
}

test('production DOM readback contains a fail-closed visual regression stage after exact-SHA promotion', async () => {
  const visualSpec = await readVisualSpec();
  assert.match(workflow, /Wait for exact deployed SHA/);
  assert.match(workflow, /Visual regression against approved PR baseline/);
  assert.match(workflow, /Resolve approved visual baseline/);
  assert.match(workflow, /portal-v2-production-visual-regression\.spec\.js/);
  assert.match(workflow, /visual-baseline-pr-/);
  assert.match(workflow, /if-no-files-found:\s*error/);
  assert.match(visualSpec, /toHaveScreenshot|pixelmatch|VISUAL_BASELINE/);
  assert.match(visualSpec, /1280/);
  assert.match(visualSpec, /canvassen/);
});

test('visual regression uses the canonical V2 demo route instead of the legacy query alias', async () => {
  const visualSpec = await readVisualSpec();
  assert.match(visualSpec, /\/portaal\/demo\?bg_visual_regression=stable/);
  assert.doesNotMatch(visualSpec, /\/klantportaal\?klant=demoAI/);
});

test('visual regression waits for the specialist canvas payload instead of screenshotting an empty async workspace shell', async () => {
  const visualSpec = await readVisualSpec();
  assert.match(visualSpec, /\.canvas-summary/);
  assert.match(visualSpec, /\.canvas-card/);
  assert.match(visualSpec, /toHaveCount\(6/);
});
