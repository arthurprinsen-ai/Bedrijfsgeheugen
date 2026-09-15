import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = name => readFile(new URL(name, root), 'utf8');

test('mobile critical CSS is loaded before app execution', async () => {
  const html = await read('index.html');
  const mobile = html.indexOf('mobile-responsive.css');
  const app = html.indexOf('src="./app.js"');
  assert.ok(mobile >= 0, 'mobile-responsive.css must be linked from index.html');
  assert.ok(app >= 0, 'app.js must remain linked');
  assert.ok(mobile < app, 'responsive CSS must load before app.js to prevent post-load layout shift');
});

test('mobile shell hides desktop utility fan-out and preserves compact controls', async () => {
  const css = await read('mobile-responsive.css');
  assert.match(css, /\.v2utilities\s*\{[^}]*display\s*:\s*none/i);
  assert.match(css, /\.searchrow\s*\{[^}]*grid-template-columns\s*:\s*minmax\(0,1fr\)\s+repeat\(3,44px\)/i);
  assert.match(css, /\.kpis\s*\{[^}]*grid-template-columns\s*:\s*repeat\(2,minmax\(0,1fr\)\)/i);
  assert.match(css, /@media\s*\(max-width:\s*430px\)/i);
});

test('mobile CSS prevents horizontal overflow and protects bottom navigation', async () => {
  const css = await read('mobile-responsive.css');
  assert.match(css, /overflow-x\s*:\s*hidden/i);
  assert.match(css, /padding-bottom\s*:\s*calc\(88px\s*\+\s*env\(safe-area-inset-bottom\)\)/i);
  assert.match(css, /\.mobilebar\s*\{[^}]*position\s*:\s*fixed/i);
});
