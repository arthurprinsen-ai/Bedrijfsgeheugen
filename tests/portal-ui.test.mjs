import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../portal/index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../portal/styles.css', import.meta.url), 'utf8');
const app = await readFile(new URL('../portal/app.mjs', import.meta.url), 'utf8');

test('portal entry has no static href attributes', () => {
  assert.equal(html.includes('href='), false);
});

test('portal includes responsive and reduced-motion design', () => {
  assert.equal(css.includes('@media(max-width:820px)'), true);
  assert.equal(css.includes('prefers-reduced-motion'), true);
  assert.equal(css.includes('.mobile-nav'), true);
});

test('portal supports search, contextual AI and detail drawer', () => {
  assert.equal(app.includes('command-modal'), true);
  assert.equal(app.includes('Bedrijfsgeheugen AI'), true);
  assert.equal(app.includes('openDetail'), true);
});

test('portal exposes all eight route renderers', () => {
  for (const id of ['today','company','intelligence','decisions','execution','impact','memory','admin']) {
    assert.equal(app.includes(id + ':'), true);
  }
});

test('portal labels sample data explicitly', () => {
  assert.equal(app.includes('Prototype · voorbeelddata'), true);
});
