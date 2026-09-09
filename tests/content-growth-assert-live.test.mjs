import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const text=fs.readFileSync('tools/content-growth/assert-live-ledger.mjs','utf8');
test('watchdog assertion uses Europe Amsterdam and requires live',()=>{
  assert.match(text,/Europe\/Amsterdam/);
  assert.match(text,/state !== 'live'/);
});
