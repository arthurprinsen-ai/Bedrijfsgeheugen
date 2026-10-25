import test from 'node:test';
import assert from 'node:assert/strict';
import { adoptionBell, companyStateRail } from '../portal-v2/visuals.js';

test('canonical adoption visual preserves five selectable stages without unsourced percentiles',()=>{
  const html=adoptionBell({current:2,benchmark:3,upperQuartile:4});
  for(const label of ['Achterblijvers','Late majority','Early majority','Early adopters','Innovators']) assert.match(html,new RegExp(label));
  assert.match(html,/Jij/);
  assert.match(html,/geen gemeten marktpercentielen/);
  assert.equal((html.match(/<details /g)||[]).length,5);
  assert.equal((html.match(/<summary /g)||[]).length,5);
  assert.doesNotMatch(html,/<svg|viewBox/);
});

test('company state graph has five finger-tappable controls, current level and accessible text',()=>{
  const html=companyStateRail({current:2,benchmark:3,upperQuartile:4});
  for(const label of ['Handwerk','Geordend','Ingericht','Verbonden','Sturend']) assert.match(html,new RegExp(label));
  assert.match(html,/v2-stage-step is-current/);
  assert.equal((html.match(/<summary /g)||[]).length,5);
  assert.match(html,/aria-label=/);
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
  for(const token of ['v2-data-point','v2-data-bar','v2-data-segment','v2-stage-step']) assert.match(visuals,new RegExp(token));
  assert.match(visuals,/VISUALS_VERSION='2026-09-18-rich-interactive'/);
});


test('the screenshot-producing legacy overview keeps its old data contracts but hides clipped SVG and supplies actual touch cards',()=>{
  const module=fs.readFileSync(new URL('../portal-v2/modules/legacy-overview-complete.js',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../portal-v2/chart-stages.css',import.meta.url),'utf8');
  for(const category of ['company-state','adoption','cmmi']) assert.match(module,new RegExp("legacyStageExplorer\\('"+category+"'"));
  assert.match(module,/data-v2-stage-chart/);
  assert.match(module,/details class="v2-stage-step/);
  assert.match(module,/summary title=/);
  assert.match(css,/\.legacy-complete \.legacy-state-svg/);
  assert.match(css,/\.legacy-complete \.legacy-adoption-svg/);
  assert.match(css,/\.legacy-complete \.legacy-cmmi > \[data-cmmi-level\]/);
  assert.match(css,/@container \(max-width:420px\)/);
});
