import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

const cms = await readFile(new URL('../assets/cms-admin.js', import.meta.url), 'utf8');
const toggle = await readFile(new URL('../tools/site-shell/homepage-toggle-browser-check.mjs', import.meta.url), 'utf8');

test('CMS selector helpers stay distinct', () => {
  assert.ok(cms.includes('querySelector(s)'));
  assert.ok(cms.includes('querySelectorAll(s)'));
  assert.ok(cms.includes('var $$=function'));
  assert.equal(cms.split('var $=function').length - 1, 1);
});

test('homepage toggle check is state deterministic', () => {
  assert.ok(toggle.includes("locator('#homepage-expertise-tab').evaluate(el => el.click())"));
  assert.ok(toggle.includes("locator('#homepage-platform-tab').evaluate(el => el.click())"));
  assert.ok(!toggle.includes("page.click('#homepage-platform-tab')"));
});
