import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('operational harness centrally hands non-self-dispatch writers to immutable shadow', async () => {
  const workflow = await readFile('.github/workflows/repo-writer-operational-verification.yml', 'utf8');
  assert.match(workflow, /handoff-shadow-after-writer:/);
  for (const writer of ['blog-bijwerken','paginacontrole','regelgeving-bijwerken','seo-controle','weekblog']) {
    assert.match(workflow, new RegExp(`writer/${writer}/`));
  }
  assert.match(workflow, /gh workflow run repo-writer-candidate-shadow\.yml/);
  assert.match(workflow, /\.base\.sha/);
  assert.match(workflow, /\.head\.sha/);
  assert.match(workflow, /\.head\.ref/);
  assert.match(workflow, /VERIFY_SHA/);
});
