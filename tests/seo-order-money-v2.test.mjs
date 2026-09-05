import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectMoneyPage, enrichMoneyPage } from '../tools/seo-order-engine/money-contract-v2.mjs';

const entry={route:'https://www.bedrijfsgeheugen.nl/afas-koppeling',role:'money',primary_intent:'afas koppeling',funnel_stage:'decide',primary_cta:{action:'frisse-blik',url:'https://www.bedrijfsgeheugen.nl/frisse-blik'},supporting_routes:['https://www.bedrijfsgeheugen.nl/blog/afas-api/','https://www.bedrijfsgeheugen.nl/blog/wat-kost-een-afas-koppeling/']};

const base=`<!doctype html><html><head><title>AFAS koppeling</title><meta name="description" content="AFAS koppeling"><link rel="canonical" href="https://www.bedrijfsgeheugen.nl/afas-koppeling"></head><body><main><h1>AFAS koppeling</h1><section data-bg-evidence="methode"><h2>Methode</h2><p>Technische analyse.</p></section><a href="https://www.bedrijfsgeheugen.nl/frisse-blik" data-bg-conversion="frisse-blik">Plan</a></main></body></html>`;

test('weak money page fails the v2 conversion contract',()=>{
  const errors=inspectMoneyPage(base,entry);
  assert.ok(errors.some(x=>x.includes('hoe-het-werkt')));
  assert.ok(errors.some(x=>x.includes('deliverables')));
  assert.ok(errors.some(x=>x.includes('prijs/kostenlogica')));
  assert.ok(errors.some(x=>x.includes('support-link')));
});

test('safe enrichment completes structural decision information without inventing evidence',()=>{
  const out=enrichMoneyPage(base,entry);
  assert.match(out,/data-bg-money-contract="v2"/);
  assert.match(out,/data-bg-intent-role="primary"/);
  assert.match(out,/data-bg-intent-owner="https:\/\/www\.bedrijfsgeheugen\.nl\/afas-koppeling"/);
  assert.match(out,/data-bg-reviewer="arthur-prinsen"/);
  assert.match(out,/Gebaseerd op implementaties met AFAS, Exact, Microsoft 365, Power BI en bedrijfsprocessen in Nederlandse organisaties\./);
  assert.match(out,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/prijzen"/);
  assert.match(out,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/blog\/afas-api\/"/);
  assert.deepEqual(inspectMoneyPage(out,entry),[]);
});

test('money enrichment is idempotent',()=>{
  const once=enrichMoneyPage(base,entry);
  assert.equal(enrichMoneyPage(once,entry),once);
});
