import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { markPrimaryConversions } from '../tools/seo-order-engine/conversion.mjs';
import { injectGrowthMeasurement } from '../tools/seo-order-engine/measurement.mjs';

const ORIGIN='https://www.bedrijfsgeheugen.nl';
const entry={role:'money',funnel_stage:'decide',primary_cta:{action:'frisse-blik',url:ORIGIN+'/frisse-blik'}};

test('historical replay: mark all three static primary CTAs, preserve header/footer and exact href',()=>{
  const original='<html><body><header><a href="/frisse-blik">Header</a></header>'+
    '<main><a href="/frisse-blik">Hero</a><a href="'+ORIGIN+'/frisse-blik">Middle</a><a href="/frisse-blik">Final</a></main>'+
    '<footer><a href="/frisse-blik">Footer</a></footer></body></html>';
  const marked=markPrimaryConversions(original,entry);
  assert.equal((marked.match(/data-bg-conversion="frisse-blik"/g)||[]).length,3);
  assert.doesNotMatch(marked.match(/<header>[\s\S]*?<\/header>/)[0],/data-bg-conversion/);
  assert.doesNotMatch(marked.match(/<footer>[\s\S]*?<\/footer>/)[0],/data-bg-conversion/);
  assert.equal(markPrimaryConversions(marked,entry),marked);
});

test('shadow: generated dynamic CTA fallback is syntactically valid and restricted to content and first-party URLs',()=>{
  const result=injectGrowthMeasurement('<html><body><main></main></body></html>',{canonical:ORIGIN+'/prijzen'});
  const script=result.match(/<script id="bg-growth-measurement">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  assert.doesNotThrow(()=>new vm.Script(script));
  assert.match(script,/el\.closest\('main'\)/);
  assert.match(script,/pathname==='\/zelfscan'/);
  assert.match(script,/pathname==='\/frisse-blik'/);
  assert.match(script,/pathname==='\/afsluiten'/);
  assert.match(script,/dest\.hostname===window\.location\.hostname/);
});

test('canary: no extra schedule, data collectors or unverified conversion revenue',()=>{
  const source=injectGrowthMeasurement('<html><body><main></main></body></html>',{canonical:ORIGIN+'/prijzen'});
  assert.match(source,/\/api\/growth-event/);
  assert.doesNotMatch(source,/emailAddress|fullName|password|new scheduler/i);
  assert.match(source,/primary_cta_click/);
  assert.match(source,/frisse_blik_start/);
});
