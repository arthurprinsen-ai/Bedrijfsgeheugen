import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const creator=read('supabase/functions/powerhouse-content-orchestrator/index.ts');
const supervisor=read('supabase/functions/powerhouse-content-loop/index.ts');
test('Anthropic request deadline fits inside supervisor and does not truncate legitimate generation at 45s',()=>{
 assert.match(creator,/AbortSignal\.timeout\(90_000\)/);
 assert.match(supervisor,/'powerhouse-content-orchestrator': 110_000/);
 // Bound a single long-running provider call inside its existing child budget,
 // but allow four independent channels to finish without serial head-of-line blocking.
 assert.match(supervisor,/const LOOP_LEASE_MS = 240_000/);
 assert.match(supervisor,/bootstrapStillInFlight = seeded\.timed_out === true \|\| seeded\.http === 0/);
 assert.match(supervisor,/else if\(!bootstrapStillInFlight\)\{/);
 assert.match(supervisor,/\.in\('channel',requiredDecisionChannels\)\s*\.limit\(4\)/);
 assert.match(supervisor,/const pendingChannels=\[\.\.\.new Set\(\(pendingGeneration\|\|\[\]\)\.map/);
 assert.match(supervisor,/\.filter\(channel=>requiredDecisionChannels\.includes\(channel\)\)/);
 assert.match(supervisor,/await Promise\.all\(pendingChannels\.map\(async channel=>/);
 assert.match(supervisor,/return \{\.\.\.result,name:'powerhouse-content-orchestrator:'\+channel,channel\}/);
});
test('social output remains concise, source bound and identity checked',()=>{
 assert.equal(creator.includes("pending.channel==='blog'?4800:2600"),false);
 assert.match(creator,/pending\.channel==='blog'\?4800:1800/);
 assert.match(creator,/PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED/);
 assert.match(creator,/const finalTextHash = await digest\(bodyText\)/);
 assert.match(creator,/callAI\(apiKey,gov\.model_id/);
 assert.match(creator,/composioFallbackEligible\(error\)/);
});
