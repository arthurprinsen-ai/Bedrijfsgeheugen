import test from 'node:test';
import assert from 'node:assert/strict';
import { decodeHtmlEntities } from '../tools/seo-order-engine/validate-locales.mjs';

test('locale validator compares serialized ampersands semantically',()=>{
  assert.equal(decodeHtmlEntities('AI Model Comparison &amp; Selector for Business'),'AI Model Comparison & Selector for Business');
  assert.equal(decodeHtmlEntities('M&amp;A operational intelligence'),'M&A operational intelligence');
});

test('locale validator decodes numeric HTML entities too',()=>{
  assert.equal(decodeHtmlEntities('R&#38;D &#x26; AI'),'R&D & AI');
});
