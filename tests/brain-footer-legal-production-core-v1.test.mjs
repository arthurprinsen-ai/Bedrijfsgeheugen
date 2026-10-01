import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const core = readFileSync('tools/bouw-v18-production-core.mjs','utf8');
const footer = readFileSync('components/footer/footer.html','utf8');

const links = [
  ['Algemene gebruiksvoorwaarden','https://www.bedrijfsgeheugen.nl/gebruiksvoorwaarden'],
  ['Privacybeleid','https://www.bedrijfsgeheugen.nl/privacy'],
  ['Cookiebeleid','https://www.bedrijfsgeheugen.nl/cookiebeleid'],
  ['Systeemstatus','https://www.bedrijfsgeheugen.nl/systeemstatus'],
];

test('production V18 builder injects the legal/status links into the visible footer', () => {
  assert.match(core,/LEGAL_FOOTER_LINKS/);
  assert.match(core,/bg-footer-legal-links/);
  assert.match(core,/class="legal"/);
  for (const [label, href] of links) {
    assert.ok(core.includes(label), `production builder missing ${label}`);
    assert.ok(core.includes(href), `production builder missing ${href}`);
  }
});

test('canonical footer component mirrors the same legal/status contract', () => {
  for (const [label, href] of links) {
    assert.ok(footer.includes(label), `footer component missing ${label}`);
    assert.ok(footer.includes(href), `footer component missing ${href}`);
  }
});
