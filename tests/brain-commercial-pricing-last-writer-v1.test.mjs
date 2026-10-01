import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('canonical pricing source contains SaaS and consulting offers before build transforms', async()=>{
  const html=await readFile('prijzen.html','utf8');
  for(const token of ['Powerhouse SaaS','Starter','Pro','Groei','Enterprise','Directie & AI Workshop','Bedrijfsgeheugen Scan','Build Sprint','Transformation / Fractional Lead','Combineer zonder dubbel te betalen']){
    assert.ok(html.includes(token), 'missing '+token);
  }
  assert.match(html,/data-tab="saas"/);
  assert.match(html,/data-tab="consulting"/);
});

test('pricing integrity and production proof enforce the new commercial surface', async()=>{
  const [integrity,workflow,browser]=await Promise.all([
    readFile('tools/site-shell/pricing-build-integrity.mjs','utf8'),
    readFile('.github/workflows/production-source-snapshot.yml','utf8'),
    readFile('tools/site-shell/verify-pricing-i18n-production.mjs','utf8')
  ]);
  for(const token of ['€ 99','€ 299','€ 749','Directie & AI Workshop','Combineer zonder dubbel te betalen']) assert.ok(integrity.includes(token));
  assert.ok(workflow.includes('COMMERCIAL_PRICING_PRODUCTION_CONTENT_PROVEN'));
  assert.ok(workflow.includes('data-tab="consulting"'));
  assert.ok(browser.includes('COMMERCIAL_PRICING_I18N_PRODUCTION_PROVEN'));
});

test('English pricing composer removes residual Dutch commercial copy', async()=>{
  const source=await readFile('tools/site-shell/apply-commercial-pricing-v1.mjs','utf8');
  for(const token of ['Executive & AI Workshop','Preparation & analysis','Integrations with your systems','During delivery you receive Pro or Growth access.','Growth access']) assert.ok(source.includes(token), token);
});

test('commercial pricing composer always rewrites the pricing main for NL and EN', async()=>{
  const source=await readFile('tools/site-shell/apply-commercial-pricing-v1.mjs','utf8');
  assert.doesNotMatch(source,/includes\('data-bg-commercial-pricing-v1'\)\)return/);
  assert.match(source,/locale==='en'\?englishPage\(\):page\(\)/);
  assert.match(source,/await apply\('prijzen\.html','nl'\)/);
  assert.match(source,/await apply\('en\/prijzen\.html','en'\)/);
});
