import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildWinstnavigatorModel} from '../winstnavigator.js';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
test('seven existing goal domains with no synthetic forecasts',()=>{
 const empty=buildWinstnavigatorModel({},{metric:'profit'});
 assert.equal(empty.metrics.length,7);
 assert.equal(empty.current,null);
 assert.equal(empty.forecast,null);
 assert.equal(empty.scenario,null);
});
test('only real, current customer time-series drive forecast and scenario',()=>{
 const history=[0,1,2,3,4].map(i=>({date:'2026-09-'+String(1+i*6).padStart(2,'0'),value:12+i*.5,evidenceRef:'ref'+i,source:'Factuurboek'}));
 const state={portal:{business_context:{goal_targets:{profit:{history}}}}};
 const a=buildWinstnavigatorModel(state,{metric:'profit',days:90,sensitivity:0,asOf:'2026-10-20T09:00:00Z'});
 const b=buildWinstnavigatorModel(state,{metric:'profit',days:90,sensitivity:10,asOf:'2026-10-20T09:00:00Z'});
 assert.equal(a.current,14);
 assert.equal(a.history.length,5);
 assert.ok(a.forecast);
 assert.notEqual(b.scenario.simulated,a.scenario.simulated);
});
test('one central mounted interaction layer with mobile, keyboard, touch, wheel, auth isolation',()=>{
 const js=fs.readFileSync(join(root,'winstnavigator.js'),'utf8');
 const css=fs.readFileSync(join(root,'winstnavigator.css'),'utf8');
 for(const item of ['showModal','subjectOf','ArrowRight','mouseenter','scroll','wheel','stateClient.subscribe','buildForesightStudioModel'])
   assert.ok(js.includes(item),item);
 assert.match(css,/scroll-snap-type/);assert.match(css,/prefers-reduced-motion/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(|Math\.random/);
});
