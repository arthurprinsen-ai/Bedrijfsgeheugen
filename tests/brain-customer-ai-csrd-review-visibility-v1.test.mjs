import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('ONE BRAIN customer-safe CSRD review is rendered only for real persisted pending evidence',async()=>{
 const src=await read('portal-next/data-sovereignty-panel.js');
 assert.match(src,/p\.last_change_impact\?\.contract==='powerhouse-cross-domain-change-v1'/);
 assert.match(src,/impact\?\.status==='REVIEW_REQUIRED'/);
 assert.match(src,/esrsCandidates\.map\(esc\)/);
 assert.match(src,/niet dat CSRD voor jouw organisatie verplicht is/);
 assert.match(src,/De gekozen AI-route wordt niet automatisch geactiveerd/);
 assert.doesNotMatch(src,/\$\{esc\(impact\.actor\)/);
 assert.doesNotMatch(src,/\$\{esc\(impact\.changeId\)/);
 const detailed=await read('tests/portal-ai-csrd-review-visibility.test.mjs');
 assert.match(detailed,/panel\.render\(\)/);
 assert.match(detailed,/assert\.doesNotMatch\(panel\.innerHTML/);
});
