import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const s=fs.readFileSync('.github/scripts/seocontrole.py','utf8');
test('canonical registry validation treats primary keyword as claim and meta as authority',()=>{
 assert.match(s,/zw = norm\(entry\.get\('primary_keyword', ''\)\)/);
 assert.doesNotMatch(s,/for zw in \[entry\.get\('primary_keyword'/);
 assert.match(s,/if expliciet:[\s\S]*return expliciet == norm\(zoekwoord\)/);
});
