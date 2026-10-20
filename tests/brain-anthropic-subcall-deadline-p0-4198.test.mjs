import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const creator=read('supabase/functions/powerhouse-content-orchestrator/index.ts');
const supervisor=read('supabase/functions/powerhouse-content-loop/index.ts');
test('Anthropic request deadline fits inside supervisor and does not truncate legitimate generation at 45s',()=>{
 assert.match(creator,/AbortSignal\.timeout\(90_000\)/);
 assert.match(supervisor,/'powerhouse-content-orchestrator': 110_000/);
 assert.match(supervisor,/const MAX_CHANNEL_GENERATIONS = 1/);
 assert.match(supervisor,/bootstrapAttempted/);
});
test('social output remains concise, source bound and identity checked',()=>{
 assert.equal(creator.includes("pending.channel==='blog'?4800:2600"),false);
 assert.match(creator,/pending\.channel==='blog'\?4800:1800/);
 assert.match(creator,/PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED/);
 assert.match(creator,/const finalTextHash = await digest\(bodyText\)/);
 assert.match(creator,/callAI\(apiKey,gov\.model_id/);
 assert.match(creator,/composioFallbackEligible\(error\)/);
});
