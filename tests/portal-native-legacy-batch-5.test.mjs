import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime=await readFile(new URL('../portal/legacy-runtime.mjs',import.meta.url),'utf8');
const company=await readFile(new URL('../portal/render-company.mjs',import.meta.url),'utf8');
const execution=await readFile(new URL('../portal/render-execution.mjs',import.meta.url),'utf8');

for(const id of ['strategie','bijhouden','roadmap']){
 test(`${id} bypasses the iframe bridge`,()=>assert.match(runtime,new RegExp(`['\"]${id}['\"]`)));
}

test('Strategiemodellen renders natively in company',()=>{
 assert.match(company,/company\/legacy\/strategie/);
 assert.match(company,/Strategiemodellen/);
});

test('Actueel houden renders natively in execution',()=>{
 assert.match(execution,/execution\/legacy\/bijhouden/);
 assert.match(execution,/Actueel houden/);
});

test('Roadmap legacy workspace renders natively in execution',()=>{
 assert.match(execution,/execution\/legacy\/roadmap/);
 assert.match(execution,/>Roadmap</);
});
