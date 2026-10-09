import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const src=readFileSync(resolve(root,'supabase/functions/powerhouse-predictive-engine/index.ts'),'utf8');
test('bounded factual source context retains strict evidence-backed IDs',()=>{
 assert.match(src,/const providerSignals=\(signals\|\|\[\]\)\.slice\(0,50\)/);
 assert.match(src,/const byKey=new Map\(\(signals\|\|\[\]\)/);
 assert.match(src,/uniqueSources\.size<minRefs/);
 assert.match(src,/evidence_signal_ids:refs\.map/);
});
test('requires structured Anthropic tool and captures safe diagnostics',()=>{
 assert.match(src,/gov\.provider!=='Anthropic'/);
 assert.match(src,/tool_choice:\{type:'tool',name:'forecast_plan'\}/);
 assert.match(src,/max_tokens:5600/);
 assert.match(src,/AI_TOOL_OUTPUT_MISSING:stop=/);
 assert.match(src,/ab\.usage\?\.output_tokens/);
});
test('keeps canonical scheduler and bounded idempotent writes',()=>{
 assert.match(src,/authorizePowerhouseScheduler\(req\)/);
 assert.match(src,/ANTHROPIC_FORECAST_TIMEOUT_MS=90000/);
 assert.match(src,/for\(let i=0;i<toWrite\.length;i\+=5\)/);
});
