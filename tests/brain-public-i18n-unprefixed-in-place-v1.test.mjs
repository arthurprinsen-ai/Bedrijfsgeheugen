import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const i18n=fs.readFileSync('assets/js/i18n.js','utf8');
const skill=fs.readFileSync('.agents/skills/powerhouse-continuity/SKILL.md','utf8');

test('public unprefixed locale switch stays in place and is governed',()=>{
  const start=i18n.indexOf('async function setLocale');
  const end=i18n.indexOf('function closeMenus',start);
  const block=i18n.slice(start,end);
  assert.match(block,/Unprefixed public routes must switch in place/);
  const afterRouted=block.slice(block.indexOf("if (routed)"));
  assert.doesNotMatch(afterRouted,/if \(!isPortal\(\)\)[\s\S]*?location\.assign/);
  assert.match(block,/await apply\(document\.body\)/);
  assert.match(skill,/public-i18n-unprefixed-in-place-20260924-v1/);
  assert.match(skill,/exact production SHA/);
  assert.match(skill,/browser-level/);
});
