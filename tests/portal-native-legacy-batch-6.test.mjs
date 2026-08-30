import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime=await readFile(new URL('../portal/legacy-runtime.mjs',import.meta.url),'utf8');
const company=await readFile(new URL('../portal/render-company.mjs',import.meta.url),'utf8');
const today=await readFile(new URL('../portal/render-today.mjs',import.meta.url),'utf8');
const app=await readFile(new URL('../portal/app.mjs',import.meta.url),'utf8');

for(const id of ['canvassen','dd','eindconclusie']){
 test(`${id} bypasses the iframe bridge`,()=>assert.match(runtime,new RegExp(`['\"]${id}['\"]`)));
}

test('Canvassen renders natively in company',()=>{
 assert.match(company,/company\/legacy\/canvassen/);
 assert.match(company,/pageHead\('Canvassen'/);
});

test('Due diligence & exit renders natively in company',()=>{
 assert.match(company,/company\/legacy\/dd/);
 assert.match(company,/Due diligence & exit/);
});

test('De eindconclusie renders natively in today',()=>{
 assert.match(today,/today\/legacy\/eindconclusie/);
 assert.match(today,/De eindconclusie/);
 assert.match(app,/renderToday\(buildTodayViewModel\(state\),route\)/);
});
