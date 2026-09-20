import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const s=fs.readFileSync('.github/scripts/seocontrole.py','utf8');
test('legacy SEO audit derives keyword ownership from canonical registry',()=>{
 assert.match(s,/def laad_canonieke_eigenaren\(\):/);
 assert.match(s,/site\/seo-order-map\.json/);
 assert.match(s,/site\/seo-order-expansion\.json/);
 assert.match(s,/canonieke_eigenaren = laad_canonieke_eigenaren\(\) or EIGENAAR/);
 assert.match(s,/for zw, eigenaar in canonieke_eigenaren\.items\(\):/);
});