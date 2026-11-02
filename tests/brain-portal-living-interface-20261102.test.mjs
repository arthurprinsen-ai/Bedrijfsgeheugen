import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { radar, curve, benchmarkBars, gantt, leakage } from '../portal-v2/visuals.js';
import { fieldMarkup } from '../portal-v2/form-primitives.js';

const repo=join(dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>readFileSync(join(repo,p),'utf8');

test('original portal design change keeps ONE BRAIN incident/skill/ledger',()=>{
 const skill=read('.agents/skills/portal-living-interface/SKILL.md');
 const lesson=JSON.parse(read('brain/learning/2026-11-02-portal-living-interface-v1.json'));
 assert.match(skill,/INCIDENT_PROTOCOL: agents-skills-register-and-self-fix-v1/);
 assert.equal(lesson.status,'CANDIDATE');
 assert.equal(lesson.parent_issue,4547);
 assert.deepEqual(lesson.evaluation.historical_replay,['tests/brain-portal-living-interface-20261102.test.mjs']);
 assert.match(read('docs/development-ledger-events/2026-11-02-portal-living-interface-v1.md'),/brain_learning/);
});
test('the canonical Portal V2 alone receives five accessible data tables',()=>{
 const html=read('portal-v2/index.html');
 assert.match(html,/living-interface\.css/);assert.match(html,/living-interface\.js/);
 assert.match(html,/insight-lens\.js/);
 const graphs=[
  radar([{label:'Proces A',value:2},{label:'Proces B',value:3},{label:'Proces C',value:4}]),
  curve([{label:'Maand 1',value:5.25},{label:'Maand 2',value:8}]),
  benchmarkBars([{label:'Waarde',value:5,benchmark:6}]),
  gantt([{title:'Actie',start:2,duration:3,progress:10}]),
  leakage([{label:'Tijd',value:4}])
 ];
 for(const chart of graphs){assert.match(chart,/<details class="bg-li-dataset">/);assert.match(chart,/<th scope="row">/);}
 assert.match(graphs[1],/5,25/);
 assert.doesNotMatch(graphs[2],/<script>/);
});
test('semantic mandatory inputs provide error recovery and no new false save state',()=>{
 const markup=fieldMarkup({id:'bedrag',label:'Bedrag',type:'number',required:true,help:'Controleer de bron'},'');
 assert.match(markup,/required aria-required="true"/);
 assert.match(markup,/aria-describedby="bedrag-error bedrag-help"/);
 assert.match(read('portal-v2/form-primitives.js'),/node\.checkValidity\(\)/);
 const js=read('portal-v2/living-interface.js');
 assert.match(js,/ArrowRight/);assert.match(js,/ArrowLeft/);
 assert.doesNotMatch(js,/localStorage|sessionStorage|fetch\(|\.post\(/);
 const css=read('portal-v2/living-interface.css');
 assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/focus-visible/);
});
