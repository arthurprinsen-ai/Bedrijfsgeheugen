import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { companyStateRail, adoptionBell, ladder } from '../portal-v2/visuals.js';

const page=readFileSync(new URL('../portal-v2/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../portal-v2/chart-stages.css',import.meta.url),'utf8');

test('all three production portal maturity visuals are semantic, mobile-tappable stages',()=>{
  const visuals=[
    companyStateRail({current:2.4,benchmark:3,upperQuartile:4}),
    adoptionBell({current:2.4,benchmark:3,upperQuartile:4}),
    ladder(Array.from({length:5},(_,i)=>({naam:'Niveau '+(i+1),huidig:i===1,uitleg:'Procesonderbouwing '+i,crisis:'Stap '+(i+1)})))
  ];
  for(const html of visuals){
    assert.match(html,/<figure class="v2visual v2-stage-chart"/);
    assert.equal((html.match(/<details /g)||[]).length,5);
    assert.equal((html.match(/<summary /g)||[]).length,5);
    assert.match(html,/aria-label=/);
    assert.match(html,/<p class="v2-stage-note">/);
    assert.doesNotMatch(html,/<svg|<text x=|<rect x=/);
  }
});
test('benchmark claims do not become fabricated percentiles',()=>{
  const markup=companyStateRail({current:2.2,benchmark:3,upperQuartile:4});
  assert.match(markup,/geen geverifieerd branchepercentiel/);
  assert.doesNotMatch(markup,/bovenste 25%|Branche.{0,25}3/);
  const adoption=adoptionBell({current:2,benchmark:3,upperQuartile:4});
  assert.match(adoption,/geen gemeten marktpercentielen/);
});
test('unverified score is not rendered as a measured maturity position',()=>{
  const markup=companyStateRail({current:null});
  assert.match(markup,/Huidig niveau nog niet onderbouwd/);
  assert.doesNotMatch(markup,/class="v2-stage-step is-current"/);
});
test('canonical Portal V2 loads a responsive CSS layer with 48px touch targets',()=>{
  assert.match(page,/\.\/chart-stages\.css\?v=20261019/);
  assert.match(css,/container-type:inline-size/);
  assert.match(css,/@container \(max-width:420px\)/);
  assert.match(css,/min-height:48px/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/hover:hover/);
  assert.match(css,/overflow:visible!important/);
});