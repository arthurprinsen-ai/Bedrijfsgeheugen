import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const files = [
  'afas-koppeling.html','exact-online-koppeling.html','twinfield-koppeling.html','webshop-koppeling.html',
  'systemen-koppelen.html','frisse-blik.html','ai-scan.html','ai-adoptie.html','due-diligence.html',
  'bedrijfsprocessen-automatiseren.html','prijzen.html'
];

test('every live money page loads the shared conversion runtime', () => {
  for (const file of files) {
    const html = fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    assert.match(html, /<script[^>]+src=["']\/assets\/stijl\.js["'][^>]*>/, file + ' must load /assets/stijl.js');
  }
});
