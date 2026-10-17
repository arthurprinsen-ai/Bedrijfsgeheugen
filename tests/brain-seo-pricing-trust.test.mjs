import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const article = readFileSync(new URL('../blog/wat-kost-digitalisering-mkb/index.html', import.meta.url), 'utf8');
const pricing = readFileSync(new URL('../prijzen.html', import.meta.url), 'utf8');

test('historical replay: SEO pricing claims match canonical offer', () => {
  for (const value of ['99', '2.950', '14.500']) {
    assert.ok(pricing.includes(value), `canonical offer missing ${value}`);
    assert.ok(article.includes(value), `article missing ${value}`);
  }
  for (const stale of ['2.900', '29 per maand', 'verkoopt geen software', '348 beheer']) {
    assert.equal(article.includes(stale), false, `obsolete offer: ${stale}`);
  }
  assert.ok(article.includes('href="https://www.bedrijfsgeheugen.nl/prijzen"'));
});
