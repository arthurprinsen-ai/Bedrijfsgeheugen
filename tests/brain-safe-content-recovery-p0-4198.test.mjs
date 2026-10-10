import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../supabase/functions/powerhouse-content-loop/index.ts',import.meta.url),'utf8');
test('restore blocked source-backed content through canonical orchestrator, never new executor',()=>{
 assert.match(source,/retryableContentBlock/);
 assert.match(source,/reason\.startsWith\('GLOBAL_POST_DUPLICATE_BLOCKED:'/);
 assert.match(source,/reason === 'SOURCE_DEADLINE_EXPIRED'/);
 assert.match(source,/\|\| retryableContentBlock\)/);
 assert.match(source,/invoke\(url, expected, 'powerhouse-content-orchestrator', \{ runDate \}\)/);
});
test('no ambiguous provider side effects or duplicate publications permitted',()=>{
 for(const gate of [
   'decision.delivery_ref','evidence.possible_provider_side_effect','evidence.republish_forbidden',
   'evidence.provider_create_success','evidence.provider_publication_ack_verified','evidence.provider_truth_verified'
 ]) assert.ok(source.includes(gate));
 assert.match(source,/generatedRounds < MAX_CHANNEL_GENERATIONS && !bootstrapStillInFlight/);
 assert.match(source,/claimLoopLease\(runDate, leaseHolder\)/);
 assert.match(source,/powerhouse-social-publisher', \{ runDate, mode: 'publish_only' \}/);
});
