import assert from 'node:assert/strict';
import test from 'node:test';
import { markPrimaryConversions, injectConversionTracker } from '../tools/seo-order-engine/conversion.mjs';

const ORIGIN = 'https://www.bedrijfsgeheugen.nl';
const entry = {
  route: `${ORIGIN}/prijzen`, role: 'money', primary_intent: 'kosten digitalisering mkb', primary_keyword: 'kosten digitalisering mkb',
  funnel_stage: 'decide', primary_cta: { action: 'frisse-blik', url: `${ORIGIN}/frisse-blik` }
};

test('primaire CTA wordt meetbaar gemarkeerd zonder href te veranderen', () => {
  const html = `<html><body><main><a class="btn" href="${ORIGIN}/frisse-blik">Plan een Frisse Blik</a></main></body></html>`;
  const out = markPrimaryConversions(html, entry);
  assert.ok(out.includes(`href="${ORIGIN}/frisse-blik"`));
  assert.ok(out.includes('data-bg-conversion="frisse-blik"'));
  assert.ok(out.includes('data-bg-page-role="money"'));
  assert.ok(out.includes('data-bg-funnel-stage="decide"'));
});

test('conversion tracker is idempotent en verstuurt alleen intentmetadata', () => {
  const html = '<html><head></head><body><main><h1>X</h1></main></body></html>';
  const once = injectConversionTracker(html);
  const twice = injectConversionTracker(once);
  assert.equal(once, twice);
  assert.equal((once.match(/id="bg-conversion-tracker"/g) || []).length, 1);
  assert.match(once, /bg_conversion_intent/);
  assert.match(once, /conversion_action/);
  assert.match(once, /landing_path/);
  assert.match(once, /target_url/);
  assert.doesNotMatch(once, /email|phone|naam|name:/i);
});
