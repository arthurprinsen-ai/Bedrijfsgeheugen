import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const s=fs.readFileSync('.github/scripts/seocontrole.py','utf8');
test('legacy SEO audit honors canonical primary keyword contract',()=>{
 assert.match(s,/zw = norm\(entry\.get\('primary_keyword', ''\)\)/);
 assert.doesNotMatch(s,/\[entry\.get\('primary_keyword', ''\)\] \+ entry\.get\('secondary_keywords'/);
 assert.match(s,/bg-zoekwoord\|bg-keyword-cluster/);
});