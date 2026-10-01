import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const productionCore = fs.readFileSync(new URL('../tools/bouw-v18-production-core.mjs', import.meta.url), 'utf8');
const footerComponent = fs.readFileSync(new URL('../components/footer/footer.html', import.meta.url), 'utf8');

const links = [
  ['Algemene gebruiksvoorwaarden','https://www.bedrijfsgeheugen.nl/gebruiksvoorwaarden'],
  ['Privacybeleid','https://www.bedrijfsgeheugen.nl/privacy'],
  ['Cookiebeleid','https://www.bedrijfsgeheugen.nl/cookiebeleid'],
  ['Systeemstatus','https://www.bedrijfsgeheugen.nl/systeemstatus']
];

test('pinned V18 production build injects all legal links into its canonical footer', () => {
  assert.match(productionCore, /bg-footer-legal-links/);
  assert.match(productionCore, /V18 canonical footer legal-link insertion point not found/);
  for (const [label, href] of links) {
    assert.ok(productionCore.includes(label), label);
    assert.ok(productionCore.includes(href), href);
  }
});

test('canonical footer component mirrors the same legal link set', () => {
  assert.match(footerComponent, /bgvoet-juridisch/);
  for (const [label, href] of links) {
    assert.ok(footerComponent.includes(label), label);
    assert.ok(footerComponent.includes(href), href);
  }
});

// footer production lineage recheck

// footer production metadata recheck
