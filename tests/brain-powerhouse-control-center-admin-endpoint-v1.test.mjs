import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Powerhouse observability endpoint never falls back to the ordinary Brain endpoint',async()=>{
  const [api,ui]=await Promise.all([
    readFile('netlify/functions/powerhouse-observability.mjs','utf8'),
    readFile('portal-v2/modules/powerhouse-observability.js','utf8')
  ]);
  assert.match(api,/isPowerhouseAdmin/);
  assert.match(api,/POWERHOUSE_ADMIN_REQUIRED/);
  assert.match(ui,/\/api\/powerhouse-observability/);
  assert.doesNotMatch(ui,/\/api\/brain-operating-loop/);
});

test('Powerhouse observability endpoint is read-only and cache resistant',async()=>{
  const api=await readFile('netlify/functions/powerhouse-observability.mjs','utf8');
  assert.match(api,/request\.method!=='GET'/);
  assert.match(api,/private, no-store/);
  assert.match(api,/pragma':'no-cache/);
  assert.match(api,/x-robots-tag':'noindex, nofollow, noarchive/);
});
