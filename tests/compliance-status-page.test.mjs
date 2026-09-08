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

test('trust center is linked from over-ons, AI Act and Portal V2 with absolute URLs', () => {
  for (const file of ['over-ons.html', 'ai-act.html', 'portal-v2/index.html']) {
    assert.match(read(file), /href="https:\/\/www\.bedrijfsgeheugen\.nl\/compliance-status"/i, `${file} mist compliance-status link`);
  }
});
