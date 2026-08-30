import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('private noindex customer login is excluded from public page and SEO scanners', async () => {
  const [pageScanner, seoScanner, login] = await Promise.all([
    readFile('.github/scripts/paginacontrole.py', 'utf8'),
    readFile('.github/scripts/seocontrole.py', 'utf8'),
    readFile('klant-login.html', 'utf8'),
  ]);

  assert.match(login, /<meta name="robots" content="noindex,nofollow">/);
  assert.match(pageScanner, /OVERSLAAN\s*=\s*\{[^}]*'klant-login'/s);
  assert.match(seoScanner, /OVERSLAAN\s*=\s*\{[^}]*'klant-login'/s);
});
