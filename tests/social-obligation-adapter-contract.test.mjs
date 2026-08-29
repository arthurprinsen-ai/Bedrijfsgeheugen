import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('BG184 declares due detection, verification, idempotency and escalation', async () => {
  const text = await readFile('docs/make/bg184-social-outcome-obligation-guardian.md', 'utf8');
  for (const token of [
    '7147086', '3600', '10 minute',
    'Post ID LinkedIn', 'Bedrijfspaginapost', 'Post ID Instagram',
    '7140072', '7140394', '7132258', '7136176',
    'type', 'source', 'idempotent'
  ]) assert.ok(text.includes(token), `missing ${token}`);
  assert.match(text, /zero[- ]candidate[\s\S]{0,160}RED/is);
});
