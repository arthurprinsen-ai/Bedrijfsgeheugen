import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const creator=read('supabase/functions/powerhouse-content-orchestrator/index.ts');
const supervisor=read('supabase/functions/powerhouse-content-loop/index.ts');

test('Anthropic 90s generation remains within 110s supervisor, with bounded deduplicated channel fanout',()=>{
 assert.match(creator,/AbortSignal\.timeout\(90_000\)/);
 assert.match(supervisor,/'powerhouse-content-orchestrator': 110_000/);
 // The former MAX_CHANNEL_GENERATIONS=1 / bootstrapAttempted contract was retired:
 // the current canonical executor bounds pending channels at four, deduplicates
 // decisions, and fans out one channel-specific request per existing worker.
 assert.match(supervisor,/\.in\('channel',requiredDecisionChannels\)\s*\.limit\(4\)/);
 assert.match(supervisor,/const pendingChannels=\[\.\.\.new Set\(/);
 assert.match(supervisor,/Promise\.all\(pendingChannels\.map\(async channel=>\{/);
 assert.match(supervisor,/invoke\(url,expected,'powerhouse-content-orchestrator',\{runDate,channel\}\)/);
 // A potentially in-flight bootstrap must NEVER be invoked again in this tick.
 // A negative database read must not silently count as successful generation.
 assert.match(supervisor,/bootstrapStillInFlight = seeded\.timed_out === true \|\| seeded\.http === 0/);
 assert.match(supervisor,/else if\(!bootstrapStillInFlight\)/);
 assert.match(supervisor,/reason:'BOOTSTRAP_MAY_STILL_BE_RUNNING'/);
 assert.match(supervisor,/PENDING_GENERATION_READ_FAILED/);
});

test('social output remains concise, source bound and identity checked',()=>{
 assert.equal(creator.includes("pending.channel==='blog'?4800:2600"),false);
 assert.match(creator,/pending\.channel==='blog'\?4800:1800/);
 assert.match(creator,/PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED/);
 assert.match(creator,/const finalTextHash = await digest\(bodyText\)/);
 assert.match(creator,/callAI\(apiKey,gov\.model_id/);
 assert.match(creator,/composioFallbackEligible\(error\)/);
});
