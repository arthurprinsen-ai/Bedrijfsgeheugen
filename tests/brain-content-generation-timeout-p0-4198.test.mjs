import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-loop/index.ts',import.meta.url),'utf8');
test('one slow Anthropic generation must not be cancelled at old 40 second limit',()=>{
 assert.match(s,/'powerhouse-content-orchestrator': 75_000/);
 assert.match(s,/const MAX_CHANNEL_GENERATIONS = 1/);
 assert.match(s,/bootstrapAttempted = true/);
 assert.match(s,/!bootstrapStillInFlight && !bootstrapAttempted/);
});
test('existing lease, async continuation and safe publishing remain',()=>{
 assert.match(s,/claimLoopLease\(runDate, leaseHolder\)/);
 assert.match(s,/releaseLoopLease\(runDate, leaseHolder\)/);
 assert.match(s,/providerSideEffectTerminal/);
 assert.match(s,/powerhouse-social-publisher', \{ runDate, mode: 'audit_only' \}/);
 assert.match(s,/powerhouse-social-publisher', \{ runDate, mode: 'publish_only' \}/);
 assert.match(s,/powerhouse-blog-queue/);
});
