import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');

test('public compliance status page exposes Bedrijfsgeheugen own status transparently', () => {
  const html = read('compliance-status.html');
  assert.match(html, /Vertrouwen & compliance/i);
  assert.match(html, /Bedrijfsgeheugen zelf/i);
  assert.match(html, /EU AI Act/i);
  assert.match(html, /NIS2/i);
  assert.match(html, /data/i);
  assert.match(html, /hosting/i);
  assert.match(html, /Aantoonbaar/i);
  assert.match(html, /In uitvoering/i);
  assert.match(html, /Bewijs ontbreekt/i);
  assert.match(html, /Niet van toepassing/i);
  assert.match(html, /openstaande/i);
  assert.match(html, /Print \/ PDF/i);
  assert.match(html, /window\.print\(\)/);
  assert.match(html, /readiness.*geen.*juridisch oordeel|geen externe certificering/is);
  assert.match(html, /href="https:\/\/www\.bedrijfsgeheugen\.nl\/privacy/);
  assert.match(html, /href="https:\/\/www\.bedrijfsgeheugen\.nl\/ai-act/);
});

test('public compliance status uses the governed functional customer portal entry', () => {
  const html = read('compliance-status.html');
  assert.match(html, /href="https:\/\/www\.bedrijfsgeheugen\.nl\/klantportaal"/i);
  assert.doesNotMatch(html, /href="https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2(?:\/|\b)/i);
});

test('shared public shell exposes trust center from over-ons and AI Act', () => {
  const shell = read('assets/stijl.js');
  assert.match(shell, /https:\/\/www\.bedrijfsgeheugen\.nl\/compliance-status/);
  assert.match(shell, /\/over-ons/);
  assert.match(shell, /\/ai-act/);
  assert.match(shell, /Hoe staat Bedrijfsgeheugen zelf ervoor|Vertrouwen & compliance/i);
});

test('Portal V2 links to Bedrijfsgeheugen own compliance status with an absolute URL', () => {
  const portal = read('portal-v2/index.html');
  assert.match(portal, /href="https:\/\/www\.bedrijfsgeheugen\.nl\/compliance-status"/i);
  assert.match(portal, /Compliance Bedrijfsgeheugen/i);
});