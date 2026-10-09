import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const engine=readFileSync(resolve(root,'supabase/functions/powerhouse-predictive-engine/index.ts'),'utf8');
const migration=readFileSync(resolve(root,'supabase/migrations/20261009171500_suspend_groq_content_calibration_fallbacks.sql'),'utf8');

test('prediction ingestion avoids repeated row-level forecast trigger cascades',()=>{
  assert.match(engine,/const \{data:known,error:lookupError\}=await db\.from\('powerhouse_predictive_signals'\)/);
  assert.match(engine,/const oldByKey=new Map/);
  assert.match(engine,/stable\(old\.evidence\)!==stable\(s\.evidence\)/);
  assert.match(engine,/const toWrite=signalRows\.filter/);
  assert.match(engine,/for\(let i=0;i<toWrite\.length;i\+=8\)/);
  assert.match(engine,/\.upsert\(batch,\{onConflict:'signal_key'\}\)/);
  assert.doesNotMatch(engine,/\.upsert\(signalRows,\{onConflict:'signal_key'\}\)/);
  assert.match(engine,/signals_ingested:ingested/);
});

test('actual source changes still propagate and new signals are not skipped',()=>{
  assert.match(engine,/if\(!old\)return true/);
  assert.match(engine,/Number\(old\[k\]\)!==Number\(s\[k\]\)/);
  assert.match(engine,/new Date\(old\.observed_at\)\.getTime\(\)!==new Date\(s\.observed_at\)\.getTime\(\)/);
});

test('governed Anthropic inference, protected scheduler, and evidence-only forecasts remain intact',()=>{
  assert.match(engine,/authorizePowerhouseScheduler\(req\)/);
  assert.match(engine,/gov\.provider!=='Anthropic'/);
  assert.match(engine,/fetch\('https:\/\/api\.anthropic\.com\/v1\/messages'/);
  assert.match(engine,/uniqueSources\.size<minRefs/);
  assert.match(engine,/generation_provider:generationProvider/);
  assert.match(engine,/if\(error\) throw error/);
});

test('only the two named Groq fallback registrations are suspended',()=>{
  assert.match(migration,/lifecycle_status='SUSPENDED'/);
  assert.match(migration,/lifecycle_status='ACTIVE'/);
  assert.match(migration,/provider='Composio\/Groq'/);
  assert.match(migration,/supabase-bg-composio-content-fallback-v1/);
  assert.match(migration,/supabase-powerhouse-forecast-calibration-fallback-v1/);
  assert.doesNotMatch(migration,/DELETE\s+FROM\s+public\.brain_ai_governance_registry/i);
  assert.doesNotMatch(migration,/SET\s+approved\s*=\s*false/i);
});
