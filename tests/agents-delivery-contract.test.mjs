import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const AGENTS_PATH = new URL('../AGENTS.md', import.meta.url);

test('AGENTS delivery synchronization rule includes semantic contract overlap', async () => {
  const agents = await readFile(AGENTS_PATH, 'utf8');

  assert.match(
    agents,
    /mergeconflict, changed-path overlap, declared contract overlap of declared dependency conflict vereist synchronisatie/,
    'AGENTS.md must mirror BRAIN-DELIVERY-v2 syncRequiredWhen, including declared semantic contract overlap',
  );
});
