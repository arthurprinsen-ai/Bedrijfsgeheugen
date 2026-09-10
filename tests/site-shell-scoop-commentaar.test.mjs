import test from 'node:test';
import assert from 'node:assert/strict';
import { scoopCss } from '../tools/bouw-v18-chrome.mjs';

test('komma in commentaar splitst geen selector: :root-tokens blijven op de scope', () => {
  const uit = scoopCss('/* Wijzig hier, dan verandert elke pagina mee. */\n:root{--geel:#FFE86B;--inkt:#14171A}');
  assert.equal(uit.trim(), '.inhoud-body{--geel:#FFE86B;--inkt:#14171A}');
});

test('commentaar binnen @media en tussen regels verdwijnt zonder selectors te breken', () => {
  const uit = scoopCss('/* a */ .a,.b{color:red} @media(max-width:9px){/* c, d */ html{x:1}}');
  assert.ok(uit.includes('.inhoud-body .a,.inhoud-body .b{color:red}'));
  assert.ok(uit.includes('@media(max-width:9px){.inhoud-body{x:1}}'));
  assert.ok(!uit.includes('/*'));
});
