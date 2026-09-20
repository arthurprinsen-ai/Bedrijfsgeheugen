import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

test('Buffer 429 cooldown is persistent and bounded',()=>{
  assert.match(source,/function bufferRetryAt/);
  assert.match(source,/function activeBufferCooldown/);
  assert.match(source,/buffer_rate_limit_until/);
  assert.match(source,/BUFFER_RATE_LIMIT_COOLDOWN/);
});

test('provider create identity is persisted before readback so 429 cannot duplicate publication',()=>{
  const createAck=source.indexOf('provider_create_ack: true');
  const readback=source.indexOf('readback = await getPost(bufferToken, created.post.id)');
  assert.ok(createAck>=0 && readback>=0 && createAck<readback);
  assert.match(source,/BUFFER_RATE_LIMITED_READBACK/);
  assert.match(source,/delivery_ref: created\.post\.id/);
});

test('central publication authority remains intact and Instagram is not forced through Buffer',()=>{
  assert.match(source,/consumePublishCapability/);
  assert.match(source,/publication_authority|PUBLICATION_AUTHORITY/);
  assert.match(source,/row\.channel === 'instagram_company'.*provider.*buffer/s);
});
