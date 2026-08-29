import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const bron = await readFile(new URL('../assets/js/menu.js', import.meta.url), 'utf8');

test('mobile drilldown preserves leftover legacy menu links under Meer', () => {
  assert.match(bron, /meer\s*:\s*['"]Meer['"]/);
  assert.match(bron, /volgorde\s*=\s*\[[^\]]*['"]meer['"]/s);
  assert.match(bron, /groepen\.meer/);
  assert.match(bron, /bron\.querySelectorAll\(['"]:scope > a\[href\]['"]\)/);
  assert.match(bron, /direct\.cta/);
});
