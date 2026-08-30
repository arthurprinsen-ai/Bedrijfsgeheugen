import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime=await readFile(new URL('../portal/legacy-runtime.mjs',import.meta.url),'utf8');
const execution=await readFile(new URL('../portal/render-execution.mjs',import.meta.url),'utf8');
const utilities=await readFile(new URL('../portal/render-admin-utilities.mjs',import.meta.url),'utf8');
const app=await readFile(new URL('../portal/app.mjs',import.meta.url),'utf8');

for(const id of ['dna','downloaden','afdrukken']){
 test(`${id} bypasses the iframe bridge`,()=>assert.match(runtime,new RegExp(`['\"]${id}['\"]`)));
}

test('strategy-to-monday DNA renders natively in execution',()=>{
 assert.match(execution,/execution\/legacy\/dna/);
 assert.match(execution,/Van strategie naar maandagochtend/);
});

test('download and print utilities expose real browser actions',()=>{
 assert.match(utilities,/admin\/legacy\/downloaden/);
 assert.match(utilities,/data-portal-action="download-state"/);
 assert.match(utilities,/admin\/legacy\/afdrukken/);
 assert.match(utilities,/data-portal-action="print"/);
 assert.match(app,/downloadPortalState/);
 assert.match(app,/window\.print\(\)/);
});
