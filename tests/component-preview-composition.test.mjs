import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { composeComponentPreview } from '../tools/compose-component-preview.mjs';

test('unknown component ids are rejected before preview composition', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bg-component-preview-'));
  await assert.rejects(
    composeComponentPreview({ componentId: 'not-a-component', outputPath: join(dir, 'preview.html') }),
    /Unknown component/
  );
});

test('component preview shell contains one isolated mounting point', async () => {
  const shell = await readFile('preview/component-shell.html', 'utf8');
  assert.equal((shell.match(/\{\{COMPONENT_HTML\}\}/g) || []).length, 1);
  assert.match(shell, /\{\{COMPONENT_CSS\}\}/);
  assert.match(shell, /\{\{COMPONENT_JS\}\}/);
});
