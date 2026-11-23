import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

test('production brand-shell oracle uses the exact canonical Trusted Advisor promises',()=>{
 const live=readFileSync('tools/site-shell/live-contract.mjs','utf8');
 const fixture=readFileSync('tools/site-shell/test-live-contract.mjs','utf8');
 const generator=readFileSync('tools/site-shell/components.mjs','utf8');
 const site=readFileSync('tools/controleer-site-ui.mjs','utf8');
 const entityFixture=readFileSync('tests/brain-production-readback-html-entity-heading-v1.test.mjs','utf8');
 for(const expected of ['Duidelijke afspraken vooraf','Klein beginnen, resultaat toetsen','Voor het Nederlandse mkb']){
   for(const [label,text] of [['live oracle',live],['test fixture',fixture],['canonical generator',generator],['sitewide gate',site],['entity heading fixture',entityFixture]]){
     assert.ok(text.includes(expected),label+' is missing current trustbar: '+expected);
   }
 }
 for(const legacy of ['Vaste prijs, geen uurtje-factuurtje','In twee weken draaiend']){
   assert.ok(!live.includes(legacy),'live oracle still requires an unsupported old promise: '+legacy);
   assert.ok(!fixture.includes(legacy),'test fixture still carries an unsupported old promise: '+legacy);
   assert.ok(!entityFixture.includes(legacy),'entity heading fixture still carries an unsupported old promise: '+legacy);
 }
});

test('original exact live-contract fixture still enforces marker, pricing and header semantics',()=>{
 const result=spawnSync(process.execPath,['tools/site-shell/test-live-contract.mjs'],{encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stderr||result.stdout||'Live shell fixture failed');
 assert.match(result.stdout,/canonical built-pricing live contract: OK/);
});

test('HTML-entity heading semantics still enforce exact consulting content',()=>{
 const result=spawnSync(process.execPath,['--test','tests/brain-production-readback-html-entity-heading-v1.test.mjs'],{encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stderr||result.stdout||'Entity-heading production regression failed');
});
