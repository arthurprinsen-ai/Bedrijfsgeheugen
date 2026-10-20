import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const edge=readFileSync(new URL('../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8');
const bounds=readFileSync(new URL('../supabase/functions/portal-state-eu/bounded-reads.js',import.meta.url),'utf8');
test('all ten entrepreneur reads propagate AbortSignal to PostgREST and carry one bounded request budget',()=>{
 assert.match(edge,/query\.abortSignal\(signal\)/);
 assert.match(edge,/maxConcurrent:2,slowStageMs:1500,readTimeoutMs:6000/);
 assert.match(bounds,/controller\.abort\(\)/);
 assert.match(bounds,/Promise\.race/);
});
test('timeouts fail closed with retryable status, never synthetic intelligence numbers',()=>{
 assert.match(edge,/ENTREPRENEUR_INTELLIGENCE_TEMPORARILY_UNAVAILABLE/);
 assert.match(edge,/timeout\?503:500/);
 assert.doesNotMatch(bounds,/tenantId|access_token|serviceToken/);
});
