import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const transport=readFileSync(resolve(ROOT,'supabase/functions/powerhouse-predictive-engine/openai-forecast.mjs'),'utf8');
const src=readFileSync(resolve(ROOT,'supabase/functions/powerhouse-predictive-engine/index.ts'),'utf8');

test('real provider tool inference retains a finite timeout below the 120s scheduled HTTP budget',()=>{
 assert.match(transport,/signal:AbortSignal\.timeout\(90000\)/);
 assert.match(transport,/max_output_tokens:6000/);
 assert.doesNotMatch(src,/AbortSignal\.timeout\(45000\)/);
});
test('deadline change preserves approved OpenAI-only route and strict forecast evidence guards',()=>{
 assert.match(src,/gov\.provider!=='OpenAI'/);
 assert.match(transport,/tool_choice:\{type:'function',name:'forecast_plan'\}/);
 assert.match(src,/generationProvider='OpenAI'/);
 assert.match(src,/uniqueSources\.size<minRefs/);
 assert.match(src,/authorizePowerhouseScheduler\(req\)/);
 assert.match(src,/const toWrite=signalRows\.filter/);
 assert.match(src,/for\(let i=0;i<toWrite\.length;i\+=5\)/);
});
