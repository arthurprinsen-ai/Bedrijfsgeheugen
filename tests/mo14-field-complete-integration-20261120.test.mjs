import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const root='pw-mo14-1/zaalplanner/';
const engineSource=readFileSync(root+'field-engine.js','utf8');
const uiSource=readFileSync(root+'field-complete.js','utf8');
const html=readFileSync(root+'index.html','utf8');
const sw=readFileSync(root+'sw.js','utf8');
const workflow=readFileSync('.github/workflows/mo14-zaalplanner-direct-netlify.yml','utf8');
function make(){const window={};vm.runInNewContext(engineSource,{window,structuredClone}, {timeout:3000});return window.PWFieldEngine;}
function arr(a){return Array.from(a);}
test('all seven field sections participate in one PWA and offline cache',()=>{
 assert.doesNotThrow(()=>new Function(uiSource));
 for(const path of ['field-unified.js','field-engine.js','field-complete.js'])assert.match(html,new RegExp(path.replace('.','\\.')));
 for(const path of ['field-engine.js','field-complete.js','field-complete.css']){assert.ok(sw.includes("'./"+path+"'"),path+' missing from offline cache');assert.ok(workflow.includes(path),path+' absent from protected deploy');}
 for(const route of ['field-home','field','field-team','field-stats','field-tactics','field-export','field-settings','field-more'])assert.ok(uiSource.includes(route),"Missing "+route);
 for(const feature of ['fieldKeeper','fieldAttendance','fieldFirstPositions','fieldActualInputs','fieldConfirmActual','fieldNotes','fieldBoard','fieldExportPdf','fieldExportPng','fieldExportBackup','fieldPreferences','fieldSaveTimes'])assert.ok(uiSource.includes(feature),'Missing '+feature);
 assert.match(uiSource,/localStorage\.setItem\('pw_mo14_mode'/);
 assert.match(html,/data-sport-choice="zaal"/);assert.match(html,/data-sport-choice="field"/);
 assert.match(workflow,/build-mo14-headers\.mjs/);
});
test('13 players, Jackie keeper, Coco forward and 6 nearly fair 11-a-side blocks',()=>{
 const e=make(),model=e.makeModel(),p=e.planOne(model,0);
 assert.ok(!p.error,p.error);
 assert.equal(e.players().length,13);assert.equal(p.keeper,'Jackie');assert.equal(p.blocks.length,6);
 assert.deepEqual(arr(p.blocks[0].bench),['Bobbi','Femke']);
 assert.equal(p.blocks[0].map.LV,'Nine');assert.equal(p.blocks[0].map.RV,'Coco-Mijn');
 for(const block of p.blocks){assert.equal(block.members.length,10);assert.equal(block.bench.length,2);
  assert.equal(new Set(block.members).size,10);
  assert.ok(!['LC','RC'].some(pos=>block.map[pos]==='Isis'));
  assert.ok(['LV','RV'].includes(Object.keys(block.map).find(pos=>block.map[pos]==='Coco-Mijn'))||block.bench.includes('Coco-Mijn'));
 }
 for(const block of p.blocks.slice(0,-1)){assert.equal(block.outs.length,2);assert.equal(block.ins.length,2);}
 const field=e.players().filter(x=>x!=='Jackie').map(x=>p.fieldMinutes[x]);assert.ok(Math.max(...field)-Math.min(...field)<=1);
 assert.equal(Object.values(p.fieldMinutes).reduce((a,b)=>a+b,0),700);
});
test('absence and keeper changes recalculate field selection, never insert absent or Coco as keeper',()=>{
 const e=make(),m=e.makeModel();m.matches[0].absent=['Bobbi'];let p=e.planOne(m,0);
 assert.ok(!p.error);assert.equal(p.blocks[0].bench.length,1);for(const b of p.blocks)assert.ok(!b.members.includes('Bobbi'));
 m.matches[0].absent=['Bobbi','Femke'];p=e.planOne(m,0);assert.ok(!p.error);assert.equal(p.blocks[0].bench.length,0);
 m.matches[0].absent=['Bobbi','Femke','Cato'];assert.match(e.planOne(m,0).error,/Minimaal 11/);
 m.matches[0].absent=[];m.matches[0].keeper='Cato';p=e.planOne(m,0);assert.ok(!p.error);assert.equal(p.keeper,'Cato');assert.ok(!p.blocks.some(b=>b.members.includes('Cato')));
 m.matches[0].keeper='Coco-Mijn';assert.match(e.planOne(m,0).error,/aanvaller/);
});
test('first ten positions can be pinned and changes propagate to later blocks',()=>{
 const e=make(),m=e.makeModel();m.matches[0].first={...e.FIRST,LA:'Bobbi'};const p=e.planOne(m,0);
 assert.equal(p.blocks[0].map.LA,'Bobbi');assert.equal(p.blocks[0].map.RV,'Coco-Mijn');assert.equal(p.blocks[0].map.LV,'Nine');
 for(const b of p.blocks)assert.equal(new Set(b.members).size,10);
});
test('confirming real match minutes changes season forecast and preserves zaal data schema',()=>{
 const e=make(),m=e.makeModel();m.matches.push({...m.matches[0],fixtureId:'field-2',first:{}});
 const before=e.planAll(m),first=before[0];assert.ok(!first.error);
 const a=first.fieldMinutes,b=Object.fromEntries(e.players().map(n=>[n,n==='Jackie'?70:0]));
 const field=Object.fromEntries(e.players().map(n=>[n,a[n]]));const f=e.players().find(n=>field[n]===59),t=e.players().find(n=>field[n]===58);
 field[f]--;field[t]++;m.matches[0].actual={confirmed:true,field,goal:b};
 const stats=e.totals(m);assert.equal(stats.confirmed,1);assert.equal(stats.rows.reduce((sum,r)=>sum+r.field,0),1400);
 assert.equal(stats.rows.find(x=>x.name==='Jackie').goal,140);
 assert.equal(stats.plans.length,2);
});
test('untrusted backup payload is trimmed and malformed durations are repaired',()=>{
 const e=make(),model=e.makeModel();model.matches[0].opponent='<img src=x onerror=alert(1)>'.repeat(10);
 model.matches[0].board=[{tool:'pen',color:'#000000',points:[[.1,.2]]}, {tool:'evil',color:'#000000',points:[]}];
 model.windows=[[0,999]];const saved=e.sanitize(model);
 assert.ok(saved.matches[0].opponent.length<=80);assert.equal(saved.matches[0].board.length,1);
 assert.deepEqual(JSON.parse(JSON.stringify(saved.windows)),[[0,12],[12,24],[24,35],[35,47],[47,59],[59,70]]);
 assert.equal(e.hardAllowed('Coco-Mijn','LC'),false);assert.equal(e.hardAllowed('Isis','RC'),false);
});
