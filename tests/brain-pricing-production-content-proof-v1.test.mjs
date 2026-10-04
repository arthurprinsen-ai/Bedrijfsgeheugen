import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {verifyPricingProductionContent} from '../tools/site-shell/verify-pricing-production-content.mjs';

test('production pricing promotion proves canonical semantic live content', () => {
  const workflow=fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');
  assert.match(workflow,/Prove pricing production content/);
  assert.match(workflow,/verify-pricing-production-content\.mjs/);
  assert.match(workflow,/PRICING_PRODUCTION_CONTENT_PROVEN/);
  assert.match(workflow,/Prove pricing toggles and English switch in production browser/);
  assert.match(workflow,/verify-pricing-i18n-production\.mjs/);
  assert.doesNotMatch(workflow,/grep -q '>Starter<'/);
});

test('semantic pricing proof accepts current canonical markup and rejects missing proposition', () => {
  const html=`
    <button data-tab="saas">Powerhouse SaaS</button>
    <button data-tab="consulting">Consulting</button>
    <section data-panel="saas"><h3>Starter</h3><h3>Pro</h3><h3>Groei</h3><h3>Enterprise</h3></section>
    <section data-panel="consulting">
      <h3>Directie &amp; AI Workshop</h3><h3>Bedrijfsgeheugen Scan</h3>
      <h3>Build Sprint</h3><h3>Transformation / Fractional Lead</h3>
      <h2>Combineer zonder dubbel te betalen</h2>
    </section>`;
  assert.equal(verifyPricingProductionContent(html).ok,true);
  const broken=verifyPricingProductionContent(html.replace('Build Sprint',''));
  assert.equal(broken.ok,false);
  assert.ok(broken.missing.includes('text:Build Sprint'));
});
