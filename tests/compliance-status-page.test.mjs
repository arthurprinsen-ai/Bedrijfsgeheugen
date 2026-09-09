import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');

test('public trust center is evidence-first and fail-closed', () => {
  const html = read('compliance-status.html');
  for (const text of ['Vertrouwen & compliance','Bedrijfsgeheugen zelf','EU AI Act','NIS2','Aantoonbaar','In uitvoering','Bewijs ontbreekt','Niet van toepassing','openstaande']) {
    assert.match(html, new RegExp(text, 'i'));
  }
  assert.match(html, /geen externe certificering/i);
  assert.match(html, /geen automatisch juridisch oordeel/i);
  assert.match(html, /window\.print\(\)/);
});

test('trust center uses absolute authored links and current canonical shell', () => {
  const html = read('compliance-status.html');
  const canonicalHeader = read('.github/canoniek/kop.html').trim();
  const canonicalFooter = read('.github/canoniek/voet.html').trim();
  assert.ok(html.includes(canonicalHeader));
  assert.ok(html.includes(canonicalFooter));
  for (const href of [
    'https://www.bedrijfsgeheugen.nl/compliance-status',
    'https://www.bedrijfsgeheugen.nl/klantportaal',
    'https://www.bedrijfsgeheugen.nl/ai-act',
    'https://www.bedrijfsgeheugen.nl/privacy',
    'https://www.bedrijfsgeheugen.nl/excel-als-crm'
  ]) assert.match(html, new RegExp(`href=["']${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`));
});

test('trust center exposes crawlable breadcrumb and structured data', () => {
  const html = read('compliance-status.html');
  assert.match(html, /aria-label="Kruimelpad"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /BreadcrumbList/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.bedrijfsgeheugen\.nl\/compliance-status">/);
});
