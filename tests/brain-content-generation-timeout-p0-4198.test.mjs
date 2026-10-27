import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const s=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-loop/index.ts',import.meta.url),'utf8');
test('one slow Anthropic generation must not be cancelled at old 40 second limit',()=>{
 assert.match(s,/'powerhouse-content-orchestrator': 110_000/);
 // Bounded per-channel fan-out replaced the serial generation rounds; a bootstrap that may still run is never invoked twice.
 assert.match(s,/\.limit\(4\)/);
 assert.match(s,/bootstrapStillInFlight = seeded\.timed_out === true \|\| seeded\.http === 0/);
 assert.match(s,/BOOTSTRAP_MAY_STILL_BE_RUNNING/);
});
test('existing lease, async continuation and safe publishing remain',()=>{
 assert.match(s,/claimLoopLease\(runDate, leaseHolder\)/);
 assert.match(s,/releaseLoopLease\(runDate, leaseHolder\)/);
 assert.match(s,/providerSideEffectTerminal/);
 assert.match(s,/powerhouse-social-publisher', \{ runDate, mode: 'audit_only' \}/);
 assert.match(s,/powerhouse-social-publisher',\{runDate,mode:'publish_only',channels:\['linkedin_personal'\]\}/);
 assert.match(s,/powerhouse-blog-queue/);
});
