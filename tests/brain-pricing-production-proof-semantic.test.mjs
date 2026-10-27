import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyPricingProductionContent} from '../tools/delivery/verify-pricing-production-content.mjs';

const page=(starter='<h3 class="plan-title">Starter</h3>')=>`
<html><body>
<button data-tab="saas">Powerhouse SaaS</button>
<button class="tab" data-tab='consulting'>Consulting & workshops</button>
${starter}
<h3>Pro</h3><h3>Groei</h3><h3>Enterprise</h3>
<section>Directie &amp; AI Workshop</section>
<section>Bedrijfsgeheugen Scan</section>
<section>Build Sprint</section>
<section>Transformation / Fractional Lead</section>
<h2>Combineer zonder dubbel te betalen</h2>
</body></html>`;

test('pricing production proof is semantic and tolerates heading attributes',()=>{
  const result=verifyPricingProductionContent(page());
  assert.equal(result.ok,true);
  assert.deepEqual(result.missingText,[]);
});

test('pricing production proof requires both visible mode labels',()=>{
  const result=verifyPricingProductionContent(page().replace('Consulting & workshops','Consulting'));
  assert.equal(result.ok,false);
  assert.ok(result.missingText.includes('Consulting & workshops'));
});

test('pricing production proof still fails closed when a canonical offer is absent',()=>{
  const result=verifyPricingProductionContent(page().replace('Build Sprint',''));
  assert.equal(result.ok,false);
  assert.ok(result.missingText.includes('Build Sprint'));
});
