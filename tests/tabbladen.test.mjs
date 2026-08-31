import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import { zoekPaginas, heeftTitel, zetPictogrammen, zetTabtitel, tabtitelScript } from '../tools/apply-tabbladen.mjs';

const config = JSON.parse(await readFile('site/tabtitels.json', 'utf8'));

test('de tabbladlaag draait in de Netlify-build, na de v18-productiebouw', async () => {
  assert.ok(existsSync('tools/apply-tabbladen.mjs'), 'tabbladlaag moet bestaan');
  assert.ok(existsSync('site/tabtitels.json'), 'tabtitels moeten in config staan');
  const netlify = await readFile('netlify.toml', 'utf8');
  const productie = netlify.match(/\[build\]\n([\s\S]*?)(?=\n\[)/)?.[1] ?? '';
  const preview = netlify.match(/\[context\.deploy-preview\]\n([\s\S]*?)(?=\n\[)/)?.[1] ?? '';
  for (const blok of [productie, preview]) {
    assert.match(blok, /node tools\/apply-tabbladen\.mjs/);
    assert.ok(
      blok.indexOf('bouw-v18-production.mjs') < blok.indexOf('apply-tabbladen.mjs'),
      'de tabbladlaag moet ná de v18-productiebouw draaien, die index.html opnieuw schrijft',
    );
  }
});

test('elke gepubliceerde pagina met een titel heeft een favicon', async () => {
  const overslaan = new Set(config.overslaan || []);
  const zonder = [];
  for (const pagina of await zoekPaginas('.')) {
    if (overslaan.has(pagina)) continue;
    const html = readFileSync(pagina, 'utf8');
    if (!heeftTitel(html)) continue;
    const gepatcht = zetPictogrammen(html, config.pictogrammen);
    if (!/<link\b[^>]*rel=["']icon["']/i.test(gepatcht)) zonder.push(pagina);
  }
  assert.deepEqual(zonder, [], 'pagina zonder favicon na de tabbladlaag');
});

test('de pictogramstap laat een pagina die het al goed heeft ongemoeid', () => {
  const html = '<html><head><title>Test</title>\n<link rel="icon" type="image/png" href="/favicon.png">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n</head><body></body></html>';
  assert.equal(zetPictogrammen(html, config.pictogrammen), html);
});

test('paneelpagina\'s krijgen precies één tabtitelscript, ook bij opnieuw draaien', () => {
  const regel = config.panelen[0];
  const html = '<html><head><title>Test</title></head><body></body></html>';
  const een = zetTabtitel(html, regel);
  const twee = zetTabtitel(een, regel);
  assert.equal(een, twee, 'de tabbladlaag moet idempotent zijn');
  assert.equal((twee.match(/id="bg-tabtitel"/g) || []).length, 1);
  assert.equal((twee.match(/<title>/g) || []).length, 1);
});

test('elke paneelregel wijst naar bestaande panelen en heeft een basistitel', () => {
  for (const regel of config.panelen) {
    assert.ok(regel.basis && regel.basis.length > 5, `basistitel ontbreekt voor ${regel.bestanden}`);
    assert.ok(regel.actief.includes(regel.voorvoegsel.replace('-', '')) || regel.actief.length > 0);
    for (const bestand of regel.bestanden) {
      assert.ok(existsSync(bestand), `paneelpagina ontbreekt: ${bestand}`);
      const html = readFileSync(bestand, 'utf8');
      assert.match(html, new RegExp(`id="${regel.voorvoegsel}`), `geen panelen met voorvoegsel ${regel.voorvoegsel} in ${bestand}`);
    }
    assert.doesNotMatch(tabtitelScript(regel), /<title>/, 'het script mag geen tweede titel-element introduceren');
  }
});
