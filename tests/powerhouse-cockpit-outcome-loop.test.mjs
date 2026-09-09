import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const apiUrl=new URL('../netlify/functions/linkedin-revenue-cockpit.mjs',import.meta.url);
const clientUrl=new URL('../intern/linkedin-revenue/cockpit.js',import.meta.url);

test('cockpit API reads unified core and records downstream outcomes',async()=>{
  const api=await readFile(apiUrl,'utf8');
  assert.match(api,/getPowerhouseActions\(15\)/);
  assert.match(api,/getPowerhouseLearning\(\)/);
  assert.match(api,/recordPowerhouseOutcome/);
  assert.match(api,/order_won/);
  assert.match(api,/makeCriticalPath:false/);
  assert.doesNotMatch(api,/queryDataSource|api\.notion\.com/);
});

test('cockpit client accepts unified schema and exposes sales outcome controls',async()=>{
  const client=await readFile(clientUrl,'utf8');
  assert.match(client,/linkedin-revenue-cockpit-v2-unified-core/);
  for(const type of ['executed','reply_received','meeting_booked','offer_created','order_won']) assert.ok(client.includes(type),`missing outcome ${type}`);
  assert.match(client,/recordOutcome\(/);
});
