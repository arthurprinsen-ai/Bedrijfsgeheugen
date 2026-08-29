import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bron = await readFile(new URL('../assets/js/menu.js', import.meta.url), 'utf8');

test('mobile drilldown keeps the exact pre-change menu content and only changes presentation', () => {
  assert.match(bron, /meer\s*:\s*['"]Meer['"]/);
  assert.match(bron, /volgorde\s*=\s*\[[^\]]*['"]meer['"]/s);
  assert.match(bron, /groepen\.meer/);
  assert.match(bron, /bron\.querySelectorAll\(['"]:scope > a\[href\]['"]\)/);
  assert.match(bron, /direct\.cta/);
  assert.doesNotMatch(bron, /href:\s*['"]\/workshops['"]/,
    'do not invent AI-workshops in the new mobile menu when it was not in the exact pre-change mobile source');
  assert.doesNotMatch(bron, /href:\s*['"]\/wijzigingen['"]/,
    'do not invent Wijzigingen in the new mobile menu when it was not in the exact pre-change mobile source');
});
