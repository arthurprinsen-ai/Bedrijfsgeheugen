import test from 'node:test';
import assert from 'node:assert/strict';
import { eigenKoppelingen } from '../tools/site-shell/apply-shell.mjs';

const stijl = '<link rel="stylesheet" href="https://www.bedrijfsgeheugen.nl/assets/stijl.css">';
const kop = '<link rel="stylesheet" href="https://www.bedrijfsgeheugen.nl/assets/kop.css?v=0466dd43">';
const ander = '<link rel="stylesheet" href="/fonts.css">';

test('oude kop.css valt weg naast de schil', () => {
  assert.deepEqual(eigenKoppelingen([kop, ander], null), [ander]);
});

test('stijl.css wordt ingebed en gescoopt op de hoofdinhoud, zonder specificiteit toe te voegen', () => {
  const [basis, rest] = eigenKoppelingen([stijl, kop, ander], '.wrap{max-width:1120px}');
  assert.match(basis, /^<style id="pagina-basis">/);
  assert.ok(basis.includes(':where(main[data-bg-component="main"]) .wrap{max-width:1120px}'));
  assert.equal(rest, ander);
});

test('zonder bron blijft de stijl.css-link staan', () => {
  assert.deepEqual(eigenKoppelingen([stijl], null), [stijl]);
});
