import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formatClsFailure, normalizeLayoutShiftEvidence, MAX_LAYOUT_SHIFT_EVENTS } from '../tools/site-shell/layout-shift-evidence.mjs';

const fixture = [{ score: 0.111421, sources: [{
  tag: 'DIV', id: 'blog-hero', previous: { x: 0, y: 45.123, width: 390, height: 48 },
  current: { x: 0, y: 88.321, width: 390, height: 48 },
  text: 'SHOULD_NOT_BE_INCLUDED',
}] }];

test('preserves fail-closed 0.100 CLS gate and logs shifted element geometry', () => {
  const message = formatClsFailure('/en/blog/afas-api', 'phone', 0.111, fixture);
  assert.match(message, /\/en\/blog\/afas-api phone: CLS 0\.111 exceeds 0\.100/);
  assert.match(message, /"tag":"div","id":"blog-hero"/);
  assert.match(message, /"y":45\.1/);
  assert.match(message, /"y":88\.3/);
  assert.doesNotMatch(message, /SHOULD_NOT_BE_INCLUDED/);
  assert.equal(formatClsFailure('/', 'phone', 0.100, fixture), null);
  assert.equal(formatClsFailure('/', 'phone', 0.099, fixture), null);
  assert.match(formatClsFailure('/', 'phone', 0.101, []), /exceeds 0\.100/);
});

test('diagnostics bound log size and do not leak page text or arbitrary attrs', () => {
  const many = Array.from({ length: 99 }, () => ({
    score: 0.001,
    sources: Array.from({ length: 7 }, () => ({ tag: 'SPAN', id: 'x', text: 'PII' })),
  }));
  const out = normalizeLayoutShiftEvidence(many);
  assert.equal(out.length, MAX_LAYOUT_SHIFT_EVENTS);
  assert.equal(out[0].sources.length, 3);
  assert.doesNotMatch(JSON.stringify(out), /PII/);
});

test('original public route, semantic visibility and input-excluded CLS gates remain enforced', () => {
  const source = readFileSync(new URL('../tools/site-shell/standalone-visibility-check.mjs', import.meta.url), 'utf8');
  assert.match(source, /if \(!entry\.hadRecentInput\)/);
  assert.match(source, /formatClsFailure\(route, viewport\.name, state\.cls, state\.layoutShifts\)/);
  assert.match(source, /loadPublicRoutes\(\)/);
  assert.match(source, /readVisibleState\(page, url\)/);
  assert.match(source, /main content is effectively empty/);
  assert.match(source, /is not visibly rendered/);
  assert.match(source, /browser\.close\(\)/);
});

test('detached source retains bounded parent chain and font/render timing without content', () => {
  const input=[{ score:0.12329, timeMs:718.3, fontStatus:'loading', sources:[{
    tag:'DIV', id:'', connected:false,
    previous:{x:8.8,y:627.4,width:381.2,height:216.6}, current:{x:0,y:0,width:0,height:0},
    ancestry:['div.wrap','section.inhoud-kop','div.page-inhoud','div#view-inhoud.page.active','html'],
    text:'private page text', token:'SUPER_SECRET'
  }]}];
  const formatted=formatClsFailure('/en/blog/afas-api','phone',0.12329,input);
  assert.match(formatted, /"timeMs":718/);
  assert.match(formatted, /"fontStatus":"loading"/);
  assert.match(formatted, /"connected":false/);
  assert.match(formatted, /"ancestry":\["div.wrap","section.inhoud-kop"/);
  assert.doesNotMatch(formatted, /private page text|SUPER_SECRET/);
  assert.equal(normalizeLayoutShiftEvidence(input)[0].sources[0].ancestry.length,5);
  assert.equal(formatClsFailure('/', 'phone', 0.100, input),null);
});

test('browser observer caches the ancestry before detachment, with bounded evidence', () => {
  const code=readFileSync(new URL('../tools/site-shell/standalone-visibility-check.mjs',import.meta.url),'utf8');
  assert.match(code,/sourceAncestry = new WeakMap/);
  assert.match(code,/sourceAncestry\.get\(source\.node\) \|\| identify\(source\.node\)/);
  assert.match(code,/change\.removedNodes/);
  assert.match(code,/fontStatus: document\.fonts\?\.status/);
  assert.match(code,/capturedNodes >= 96/);
  assert.match(code,/if \(!entry\.hadRecentInput\)/);
});
