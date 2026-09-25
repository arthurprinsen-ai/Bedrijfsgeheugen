import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('control-plane-only paths are excluded from production push triggers', async () => {
  for (const workflow of [
    '.github/workflows/production-source-snapshot.yml',
    '.github/workflows/production-release-readback.yml',
  ]) {
    const source = await readFile(workflow, 'utf8');
    const trigger = source.split(/\npermissions:/, 1)[0];
    for (const expected of [
      'AGENTS.md',
      'brain/policies/**',
      'tools/delivery/**',
      'tools/site-shell/verify-targeted-website-routes.mjs',
    ]) assert.ok(trigger.includes(expected), `${workflow} missing ${expected}`);
  }
});
