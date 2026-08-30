import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const redirects = readFileSync(new URL('../_redirects', import.meta.url), 'utf8');
const frisseBlik = readFileSync(new URL('../frisse-blik.html', import.meta.url), 'utf8');

test('demo1 serves the legacy customer portal without changing the public URL', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=demo1\s+\/klantportaal-demo\.html\s+200!$/m);
});

test('old demo alias redirects canonically to demo1', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=demo\s+\/klantportaal\?klant=demo1\s+301!$/m);
});

test('Ijsselmonde serves the legacy full customer portal', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=ijsselmonde\s+\/klantportaal\.html\s+200!$/m);
});

test('demoAI serves the current AI portal without changing the public URL', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=demoAI\s+\/portal\/\s+200!$/m);
});

test('other customer slugs still go to the current portal', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=:klant\s+\/portal\/\s+302!$/m);
});

test('Frisse Blik bare portal handoff resolves to the legacy demo', () => {
  assert.match(frisseBlik, /\/klantportaal#direct/);
  assert.match(redirects, /^\/klantportaal\s+\/klantportaal-demo\.html\s+200!$/m);
});
