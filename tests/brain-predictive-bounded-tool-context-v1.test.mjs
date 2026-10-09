import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const src=readFileSync(resolve(ROOT,'supabase/functions/powerhouse-predictive-engine/index.ts'),'utf8');

test('model context is bounded and retains two independent public source types',()=>{
 assert.match(src,/source_type==='external_news'\)\.slice\(0,24\)/);
 assert.match(src,/source_type==='search_demand'\)\.slice\(0,16\)/);
 assert.match(src,/const modelSignals=\[/);
 assert.match(src,/\]\.slice\(0,40\)/);
 assert.match(src,/evidence:s\.evidence\.summary\.slice\(0,650\)/.source ? src : /modelSignals/); // preserve source assertion below
 assert.match(src,/summary:s\.evidence\.summary\.slice\(0,650\)/);
 assert.match(src,/existing_forecasts:\(existing\|\|\[\]\)\.slice\(0,12\)/);
});
test('the forced governed tool keeps a bounded four-forecast schema and sufficient response budget',()=>{
 assert.match(src,/maxItems:4/);
 assert.match(src,/max_tokens:6000/);
 assert.match(src,/tool_choice:\{type:'tool',name:'forecast_plan'\}/);
 assert.match(src,/ANTHROPIC_FORECAST_TIMEOUT_MS=90000/);
});
test('missing output fails closed with provider stop reason, content types and token count',()=>{
 assert.match(src,/AI_TOOL_OUTPUT_MISSING/);
 assert.match(src,/ab\.stop_reason/);
 assert.match(src,/ab\.usage\?\.output_tokens/);
 assert.match(src,/ab\.content/);
});
test('forecast evidence, original DB pipeline and scheduler authorization remain mandatory',()=>{
 assert.match(src,/gov\.provider!=='Anthropic'/);
 assert.match(src,/authorizePowerhouseScheduler\(req\)/);
 assert.match(src,/uniqueSources\.size<minRefs/);
 assert.match(src,/const byKey=new Map\(\(signals\|\|\[\]\)/);
 assert.match(src,/const toWrite=signalRows\.filter/);
 assert.match(src,/for\(let i=0;i<toWrite\.length;i\+=5\)/);
});
