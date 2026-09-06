import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('getekende offerte wordt idempotent won_order + revenue outcome zonder PII',async()=>{
  const sql=await readFile('supabase/migrations/20260906_signed_order_revenue_outcomes.sql','utf8');
  assert.match(sql,/offerte_inzendingen/i);
  assert.match(sql,/growth_outcomes/i);
  assert.match(sql,/won_order/i);
  assert.match(sql,/revenue_eur/i);
  assert.match(sql,/growth_brain_queue/i);
  assert.match(sql,/on conflict\s*\(outcome_id\)\s*do nothing/i);
  assert.match(sql,/when\s+\(new\.getekend\s+is\s+true\)/i);
  assert.doesNotMatch(sql,/klant_slug[^\n]*growth_outcomes/i);
});

test('attribution is optional and is never fabricated from a generic landing page',async()=>{
  const sql=await readFile('supabase/migrations/20260906_signed_order_revenue_outcomes.sql','utf8');
  assert.match(sql,/attribution_root_key/i);
  assert.match(sql,/offerte:\s*['"]?\s*\|\|\s*new\.id::text/i);
  assert.doesNotMatch(sql,/bedrijfsgeheugen\.nl\/(prijzen|product|frisse-blik)/i);
});
