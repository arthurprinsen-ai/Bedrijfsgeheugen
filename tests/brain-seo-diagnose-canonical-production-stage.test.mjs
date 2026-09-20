import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const w=fs.readFileSync('.github/workflows/paginacontrole-debug.yml','utf8');
test('SEO diagnose validates the complete canonical pricing/site pipeline',()=>{
 assert.match(w,/Production build — canonical policy \+ SEO enrichment[\s\S]*BG_PRICING_STAGE=all node tools\/prijzen-uit-de-homepage\.mjs/);
 assert.doesNotMatch(w,/Production build — canonical policy \+ SEO enrichment[\s\S]{0,120}BG_PRICING_STAGE=normalize/);
});