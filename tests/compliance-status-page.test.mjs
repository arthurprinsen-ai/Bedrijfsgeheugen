import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');

test('public trust center is evidence-first and fail-closed', () => {
  const html = read('compliance-status.html');
  for (const text of ['Vertrouwen & compliance','Bedrijfsgeheugen zelf','EU AI Act','NIS2','Aantoonbaar','In uitvoering','Bewijs ontbreekt','Niet van toepassing','openstaande']) {
    assert.ok(html.toLowerCase().includes(text.toLowerCase()), `missing ${text}`);
  }
  assert.ok(html.includes('geen externe certificering'));
  assert.ok(html.includes('geen automatisch juridisch oordeel'));
  assert.ok(html.includes('window.print()'));
});

test('authored trust-center links are absolute public URLs', () => {
  const html = read('compliance-status.html');
  for (const href of [
    'https://www.bedrijfsgeheugen.nl/compliance-status',
    'https://www.bedrijfsgeheugen.nl/klantportaal',
    'https://www.bedrijfsgeheugen.nl/ai-act',
    'https://www.bedrijfsgeheugen.nl/privacy',
    'https://www.bedrijfsgeheugen.nl/excel-als-crm'
  ]) assert.ok(html.includes(`href="${href}"`), `missing absolute href ${href}`);
});

test('trust center exposes crawlable identity, breadcrumb and structured data', () => {
  const html = read('compliance-status.html');
  assert.ok(html.includes('class="bgkop"'));
  assert.ok(html.includes('class="bgvoet"'));
  assert.ok(html.includes('aria-label="Kruimelpad"'));
  assert.ok(html.includes('application/ld+json'));
  assert.ok(html.includes('BreadcrumbList'));
  assert.ok(html.includes('<link rel="canonical" href="https://www.bedrijfsgeheugen.nl/compliance-status">'));
});
