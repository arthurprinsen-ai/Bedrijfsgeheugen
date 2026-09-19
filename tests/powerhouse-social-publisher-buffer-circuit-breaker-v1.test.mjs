import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sourcePath = 'supabase/functions/powerhouse-social-publisher/index.ts';

test('Buffer 429 cooldown prevents repeated provider polling and preserves create idempotency', async () => {
  const source = await readFile(sourcePath, 'utf8');
  assert.match(source, /function activeBufferCooldown\(rows: any\[\]\)/);
  assert.match(source, /BUFFER_RATE_LIMIT_COOLDOWN/);
  assert.match(source, /status: 'deferred_rate_limit'/);
  assert.match(source, /provider_create_ack: true/);
  assert.match(source, /delivery_ref: created\.post\.id/);
  assert.match(source, /BUFFER_RATE_LIMITED_READBACK/);
  assert.match(source, /if \(row\.channel === 'instagram_company'.*provider.*buffer/);
});
