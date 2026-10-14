import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync('supabase/functions/powerhouse-commercial-heartbeat-runner/index.ts','utf8');

test('commercial heartbeat has a bounded pool for independent stage transactions',()=>{
  assert.match(source,/postgres\(poolerUrl\(\),\s*\{[\s\S]*?max:\s*4\s*,/);
  assert.match(source,/Promise\.all\(\[\s*materializeCommercialIntent\(\),\s*reviewContactAuthority\(\),\s*runOutboundLanes\(\)/);
  assert.match(source,/pg_try_advisory_xact_lock/);
});
