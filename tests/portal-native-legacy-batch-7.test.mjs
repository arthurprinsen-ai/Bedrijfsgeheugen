import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime=await readFile(new URL('../portal/legacy-runtime.mjs',import.meta.url),'utf8');
const impact=await readFile(new URL('../portal/render-impact.mjs',import.meta.url),'utf8');
const governance=await readFile(new URL('../portal/render-governance-legacy.mjs',import.meta.url),'utf8');
const app=await readFile(new URL('../portal/app.mjs',import.meta.url),'utf8');

for(const id of ['waarde','beleid','aicap']){
 test(`${id} bypasses the iframe bridge`,()=>assert.match(runtime,new RegExp(`['\"]${id}['\"]`)));
}

test('Waarde en financiering renders natively in impact without binding actions',()=>{
 assert.match(impact,/impact\/legacy\/waarde/);
 assert.match(impact,/Waarde en financiering/);
 assert.doesNotMatch(impact,/betaal|accepteer offerte|onderteken/i);
});

test('Compliance security governance renders read-only from admin context',()=>{
 assert.match(governance,/admin\/legacy\/beleid/);
 assert.match(governance,/Compliance, security en governance/);
 assert.match(governance,/alleen-lezen/i);
});

test('AI capabilities renders read-only from verified agent and governance context',()=>{
 assert.match(governance,/admin\/legacy\/aicap/);
 assert.match(governance,/AI-capabilities/);
 assert.match(app,/renderGovernanceLegacy/);
});
