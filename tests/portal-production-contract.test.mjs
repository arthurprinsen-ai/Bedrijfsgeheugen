import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,access } from 'node:fs/promises';
const required=['core.mjs','legacy-map.mjs','view-model.mjs','render-shell.mjs','render-today.mjs','render-company.mjs','render-intelligence.mjs','render-decisions.mjs','render-execution.mjs','render-impact.mjs','render-memory.mjs','render-admin.mjs','data-adapter.mjs','permissions.mjs','evidence.mjs','app.mjs','styles.css','index.html'];
test('all production portal modules exist',async()=>{for(const f of required)await access(new URL(`../portal/${f}`,import.meta.url))});
test('app uses cached adapter and nonblocking refresh',async()=>{const app=await readFile(new URL('../portal/app.mjs',import.meta.url),'utf8');assert.ok(app.includes('loadInitial'));assert.ok(app.includes('queueMicrotask'));assert.ok(app.includes('refresh'))});
test('theme color matches approved light portal',async()=>{const html=await readFile(new URL('../portal/index.html',import.meta.url),'utf8');assert.ok(html.includes('#f8faff'))});
