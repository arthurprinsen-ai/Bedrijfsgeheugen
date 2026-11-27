import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const publisher = readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');
const start = publisher.indexOf('async function ensureLinkedInCompanyMeasuredLink');
const end = publisher.indexOf('async function linkedinCompanyAuthorUrn',start);
const gate = publisher.slice(start,end);

test('company CTA target matches a promised free checklist or selfscan',()=>{
  assert.ok(start>=0 && end>start);
  assert.match(gate,/freeAction=.*checklist\|zelfscan/);
  assert.match(gate,/freeAction\?'\/zelfscan':'\/frisse-blik'/);
});

test('publisher verifies the actual HTTP redirect before successful delivery',()=>{
  assert.match(gate,/await fetch\(measuredUrl/);
  assert.match(gate,/redirect:'follow'/);
  assert.match(gate,/if\(!response\.ok/);
  assert.match(gate,/final\.pathname\.replace/);
  assert.match(gate,/LINKEDIN_COMPANY_CTA_END_TO_END_FAILED/);
  assert.ok(gate.indexOf('await fetch(measuredUrl') < gate.indexOf('measurable_link_verified:true'));
});

test('publisher keeps one deterministic daily campaign key and checks failure',()=>{
  assert.match(gate,/li-company-'\+compact/);
  assert.match(gate,/bg_campaign_links/);
  assert.match(gate,/if\(linkError\)throw new Error/);
});
