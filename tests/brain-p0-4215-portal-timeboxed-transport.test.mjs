import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../supabase/functions/portal-state-eu/index.ts',import.meta.url),'utf8');
const worker=readFileSync(new URL('../supabase/functions/portal-state-eu/bounded-reads.js',import.meta.url),'utf8');
test('portal ten-stage reads have bounded HTTP lifetime and real abort',()=>{
 assert.match(source,/maxConcurrent:2,perStageTimeoutMs:3800,slowStageMs:1500/);
 assert.match(source,/query\.abortSignal\(signal\)/);
 assert.match(worker,/AbortSignal\.timeout\(perStageTimeoutMs\)/);
 assert.match(worker,/await job\(signal\)/);
});
test('read authority, privacy and ten exact stages survive changes',()=>{
 for(const k of ['SOURCES','PUBLICATIONS','EXTERNAL_SIGNALS','DOMAIN_REGISTRY','SOURCE_CATALOG','SIGNAL_PROJECTION','COMPANY_IMPACT','CANONICAL_ACTIONS','TENANT_ACTIONS','INTELLIGENCE_SNAPSHOT'])
 assert.ok(worker.includes("'"+k+"'"),k);
 assert.match(source,/\.eq\('tenant_id',tenantId\)/);
 assert.match(source,/ENTREPRENEUR_INTELLIGENCE_READ_FAILED/);
});
