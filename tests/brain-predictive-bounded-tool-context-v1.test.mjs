import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const transport=readFileSync(resolve(ROOT,'supabase/functions/powerhouse-predictive-engine/openai-forecast.mjs'),'utf8');
const src=readFileSync(resolve(ROOT,'supabase/functions/powerhouse-predictive-engine/index.ts'),'utf8');

test('model context is bounded and retains two independent public source types',()=>{
 assert.match(src,/source_type==='external_news'\)\.slice\(0,24\)/);
 assert.match(src,/source_type==='search_demand'\)\.slice\(0,16\)/);
 assert.match(src,/const modelSignals=\[/);
 assert.match(src,/\]\.slice\(0,40\)/);
 assert.match(transport,/k==='summary'\?650:500/);
 assert.doesNotMatch(src,/existing_forecasts:|revenue_learnings:/);
});
test('the forced governed tool keeps a bounded four-forecast schema and sufficient response budget',()=>{
 assert.match(src,/maxItems:4/);
 assert.match(transport,/max_output_tokens:Math\.min\(6000,maxOutputTokens\)/);
 assert.match(transport,/tool_choice:\{type:'function',name:toolName\}/);
 assert.match(transport,/Math\.min\(90000,timeoutMs\)/);
});
test('missing output fails closed with provider stop reason, content types and token count',()=>{
 assert.match(transport,/AI_TOOL_OUTPUT_MISSING/);
 assert.match(transport,/body.status!=='completed'/);
 assert.match(transport,/AI_TOOL_OUTPUT_INVALID/);
 assert.match(transport,/body.output/);
});
test('forecast evidence, original DB pipeline and scheduler authorization remain mandatory',()=>{
 assert.match(src,/gov\.provider!=='OpenAI'/);
 assert.match(src,/authorizePowerhouseScheduler\(req\)/);
 assert.match(src,/uniqueSources\.size<minRefs/);
 assert.match(src,/const byKey=new Map\(\(signals\|\|\[\]\)/);
 assert.match(src,/const toWrite=signalRows\.filter/);
 assert.match(src,/for\(let i=0;i<toWrite\.length;i\+=5\)/);
});
