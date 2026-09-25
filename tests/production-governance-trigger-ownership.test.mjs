import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

for (const workflow of [
  '.github/workflows/production-source-snapshot.yml',
  '.github/workflows/production-release-readback.yml',
]) {
  test(`${workflow} ignores governance-only prevention registry on main push`, async () => {
    const text = await readFile(workflow, 'utf8');
    const triggerBlock = text.split(/\npermissions:/, 1)[0];
    assert.match(triggerBlock, /paths-ignore:/);
    assert.match(triggerBlock, /config\/delivery-prevention-rules\.json/);
  });
}
