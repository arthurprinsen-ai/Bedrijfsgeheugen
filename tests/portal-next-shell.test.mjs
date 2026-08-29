import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../portal-next/index.html', import.meta.url), 'utf8');
const css = readFileSync(new URL('../portal-next/portal-next.css', import.meta.url), 'utf8');
const workspaceCss = readFileSync(new URL('../portal-next/workspaces.css', import.meta.url), 'utf8');
const js = readFileSync(new URL('../portal-next/portal-next.js', import.meta.url), 'utf8');

const routes = ['Overzicht','Strategie','Groei','Operatie','Organisatie','Data & Technologie','Uitvoering','Mijn werk','Model Library','Trust & Governance','Beheer'];

test('next portal has definitive information architecture without replacing legacy portal', () => {
  for (const label of routes) assert.match(html, new RegExp(label.replace('&','&amp;|&')));
  assert.match(html, /Preview · voorbeelddata · geen actieve bedrijfswaarheid/);
  assert.match(html, /workspaces\.css/);
});

test('all non-overview navigation workspaces have executable render contracts', () => {
  for (const label of routes.slice(1)) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    assert.match(js, new RegExp(`['\"]${escaped}['\"]\\s*:`), `${label} workspace missing`);
  }
  assert.match(js, /function renderRoute/);
  assert.match(js, /setCurrentRoute/);
});

test('management summary is first-class and business map is interactive', () => {
  assert.match(html, /AI Management Summary/);
  assert.match(html, /Wat vraagt aandacht/);
  assert.match(html, /Business Health/);
  assert.match(html, /id="businessGraph"/);
  assert.match(js, /data-node/);
});

test('Trust workspace includes AI Register, Agent Team and Access Center', () => {
  assert.match(js, /AI Register/);
  assert.match(js, /Agent Team/);
  assert.match(js, /Access Center/);
  assert.match(js, /View geeft niet automatisch Export of AI Process/);
});

test('change workspace preserves Working versus Active and verified impact semantics', () => {
  assert.match(js, /WORKING en ACTIVE blijven gescheiden/);
  assert.match(js, /Expected/);
  assert.match(js, /Observed/);
  assert.match(js, /Verified/);
});

test('AI command preview cannot perform a real AI call and documents governed runtime path', () => {
  assert.match(js, /preview voert geen echte AI-call uit/i);
  assert.match(js, /Permission Engine → AI Use Case → Context Broker → approved provider → Result Gateway/);
  assert.doesNotMatch(js, /fetch\s*\(/);
});

test('essential interactions have keyboard/reduced-motion/mobile equivalents', () => {
  assert.match(js, /Escape/);
  assert.match(js, /metaKey \|\| event.ctrlKey/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(workspaceCss, /focus-visible/);
  assert.match(html, /class="mobile-nav"/);
  assert.match(html, /aria-label="Zoek of vraag Bedrijfsgeheugen"/);
  assert.match(js, /label === 'AI'/);
});
