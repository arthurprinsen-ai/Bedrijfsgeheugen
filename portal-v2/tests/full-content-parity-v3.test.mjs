import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildStrategicModels } from '../strategic-models.js';
import { buildCanvasPresentation, CANVAS_SPECS } from '../canvas-presentation.js';

const state={portal:{
 profile:{headcount:48,hourlyCost:75,maturity:{operatie:2,commercie:3,service:2,finance:3,mensen:2,tech:2,sturing:3,analytics:2,quality:3,culture:3},dimensions:{operatie:2,commercie:3,service:2,finance:3,mensen:2,tech:2,sturing:3,analytics:2,quality:3,culture:3}},
 metrics:{revenue:4200,grossMargin:41,ebitda:520,customers:84,largestCustomer:28,repeat:61},
 market:{industry:'ICT',growth:2.4,digitalIntensity:3.2},
 canvases:{bmc:{answer:'MKB-bedrijven die processen willen verbeteren'},vpc2:{answer:'Snelheid en zekerheid'},lean:{answer:'Dubbele invoer'},merk:{answer:'Aanpakken zonder aanmodderen'},content:{answer:'Hoe krijg ik grip op mijn processen?'},sales2:{answer:'Directies met concrete operationele pijn'}}
}};

test('strategic models restore substantive legacy model set including BCG',()=>{
 const models=buildStrategicModels(state);
 const names=models.map(x=>x.id);
 for(const id of ['swot','balanced-scorecard','seven-s','blue-ocean','ansoff','three-horizons','bcg','five-forces','value-chain','destep','value-proposition','pdca-dmaic','rice-moscow','value-disciplines','kano']) assert.ok(names.includes(id),`missing ${id}`);
 const bcg=models.find(x=>x.id==='bcg');
 assert.equal(bcg.metrics.marketGrowth,2.4);
 assert.equal(bcg.metrics.industryPosition,3.2);
 assert.ok(['star','cash-cow','question-mark','dog'].includes(bcg.position));
 assert.match(bcg.explanation,/markt|positie/i);
 assert.ok(bcg.quadrants.every(q=>q.title&&q.explanation));
});

test('canvas parity contains six fully structured canvases, not question+owner placeholders',()=>{
 assert.equal(CANVAS_SPECS.length,6);
 const presentation=buildCanvasPresentation(state);
 assert.equal(presentation.canvases.length,6);
 for(const canvas of presentation.canvases){
  assert.ok(canvas.sections.length>=4,`${canvas.id} has too few sections`);
  assert.ok(canvas.sections.every(section=>section.label&&section.value!==undefined));
  assert.ok(canvas.prompt.length>10);
 }
 assert.equal(presentation.completion.answered,6);
 assert.match(presentation.conclusion.text,/6|canvas/i);
});

test('canvas output is derived from the same canonical portal state',()=>{
 const out=buildCanvasPresentation(state);
 const bmc=out.canvases.find(x=>x.id==='bmc');
 assert.ok(bmc.sections.some(x=>String(x.value).includes('48')));
 assert.ok(bmc.sections.some(x=>String(x.value).includes('28')));
 assert.equal(bmc.answer,state.portal.canvases.bmc.answer);
});

test('specialist parity workspaces preserve the existing functional workspace contract',async()=>{
 const strategic=await readFile(new URL('../modules/strategic-models-workspace.js',import.meta.url),'utf8');
 const canvases=await readFile(new URL('../modules/canvas-workspace.js',import.meta.url),'utf8');
 for(const [name,source] of [['strategic',strategic],['canvases',canvases]]){
  assert.match(source,/functionalWorkspace|functional-workspace/,`${name} must expose data-functional-workspace`);
  assert.match(source,/data-workspace-tab/,`${name} must keep workspace tabs`);
  assert.match(source,/analyse/,`${name} must keep the analyse tab used by parity evidence`);
 }
});
