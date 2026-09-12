import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { zonderSchilblokken, stijlId } from '../tools/site-shell/apply-shell.mjs';
import { repairUtf8Mojibake } from '../tools/site-shell/repair-wijzigingen-encoding.mjs';

test('stijlblok met een id uit de schil komt niet nog een keer mee met de pagina', () => {
  const schil = '<head><style id="v18-inhoud">.a{}</style><style id="v18-modules">.b{}</style>';
  const pagina = ['<style id="v18-inhoud">.a{}</style>', '<style id="pagina-structuur">.c{}</style>', '<style>.d{}</style>', '<style id="v18-modules">.b{}</style>'];
  assert.deepEqual(zonderSchilblokken(pagina, schil), ['<style id="pagina-structuur">.c{}</style>', '<style>.d{}</style>']);
});

test('een id dat twee keer in de pagina staat, blijft één keer over', () => {
  const pagina = ['<style id="eigen">.x{}</style>', '<style id="eigen">.x{}</style>'];
  assert.equal(zonderSchilblokken(pagina, '<head>').length, 1);
});

test('stijlId leest alleen het id van het style-element zelf', () => {
  assert.equal(stijlId('<style id="v18-inhoud">.a{}</style>'), 'v18-inhoud');
  assert.equal(stijlId('<style>.a[id="x"]{}</style>'), null);
});

test('wijzigingen uitgelegd reserveert de tablet-railhoogte voordat JS de knoppen toevoegt', async () => {
  const html = await readFile(new URL('../wijzigingen-uitgelegd.html', import.meta.url), 'utf8');
  const rail = html.match(/\.rail\{([^}]*)\}/)?.[1] || '';
  assert.match(rail, /min-height\s*:\s*76px/i, 'lege voortgangsrail moet vooraf de uiteindelijke hoogte reserveren om tablet CLS te voorkomen');
});

test('finale build herstelt UTF-8 mojibake zonder de bedoelde Nederlandse tekst te verliezen', () => {
  const kapot = 'EÃ©n ding veranderen â zonder aanmodderen. Prijsvraag: â‚¬ 2.900.';
  assert.equal(repairUtf8Mojibake(kapot), 'Eén ding veranderen — zonder aanmodderen. Prijsvraag: € 2.900.');
});
