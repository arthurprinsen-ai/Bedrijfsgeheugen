import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const workflow = await readFile('.github/workflows/unified-brain-delivery.yml', 'utf8');

test('backend lane executes tests/supabase-* because they are classified as backend', () => {
  assert.match(
    workflow,
    /node --test[^\n]*tests\/supabase-\*\.test\.mjs/,
    'backend lane must execute every tests/supabase-* test it classifies',
  );
});
