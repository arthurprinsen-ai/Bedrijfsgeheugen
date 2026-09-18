import test from 'node:test';
import assert from 'node:assert/strict';
import { adoptionBell, companyStateRail } from '../portal-v2/visuals.js';

test('legacy adoption visual keeps five stages and three comparison markers',()=>{
  const html=adoptionBell({current:2,benchmark:3,upperQuartile:4});
  for(const label of ['Achterblijvers','Late majority','Early majority','Early adopters','Innovators']) assert.match(html,new RegExp(label));
  assert.match(html,/Jij/);
  assert.match(html,/Branche/);
  assert.match(html,/Bovenste 25%/);
  assert.match(html,/v2-adoption-line/);
});

test('company state visual keeps five-stage interactive rail',()=>{
  const html=companyStateRail({current:2,benchmark:3,upperQuartile:4});
  for(const label of ['Ad-hoc','Reactief','Gestuurd','Voorspellend','Zelfsturend']) assert.match(html,new RegExp(label));
  assert.match(html,/role="button"/);
  assert.match(html,/tabindex="0"/);
});

import fs from 'node:fs';

test('overview keeps old rich graph interactions instead of flat cards',()=>{
  const source=fs.readFileSync(new URL('../portal-v2/modules/legacy-overview-complete.js',import.meta.url),'utf8');
  for(const token of [
    'legacy-state-svg',
    'data-state-level',
    'legacy-adoption-point',
    'data-adoption-current-dot',
    'data-adoption-level',
    'data-cmmi-level',
    'pointerdown',
    'Waar de tijd weglekt',
    'bovenste 25%'
  ]) assert.match(source,new RegExp(token));
  assert.match(source,/LEGACY_OVERVIEW_COMPLETE_VERSION='2026-09-18-v2-rich-interactive'/);
});

test('profile restores benchmark plus radar pair and generic graph primitives are focusable',()=>{
  const pageVisuals=fs.readFileSync(new URL('../portal-v2/page-visuals.js',import.meta.url),'utf8');
  const visuals=fs.readFileSync(new URL('../portal-v2/visuals.js',import.meta.url),'utf8');
  assert.match(pageVisuals,/Profiel tegenover de bovenste 25%/);
  assert.match(pageVisuals,/Alles in één beeld/);
  for(const token of ['v2-data-point','v2-data-bar','v2-data-segment','v2-data-step']) assert.match(visuals,new RegExp(token));
  assert.match(visuals,/VISUALS_VERSION='2026-09-18-rich-interactive'/);
});
