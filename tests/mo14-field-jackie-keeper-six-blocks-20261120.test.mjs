import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('pw-mo14-1/veldplanner/index.html','utf8');
const extract=(name,next)=>{const begin=source.indexOf('const '+name+'=');const end=source.indexOf(';\nconst '+next+'=',begin);assert.ok(begin>=0&&end>begin,name);return JSON.parse(source.slice(begin+('const '+name+'=').length,end))};
const roster=extract('PLAYERS','LINEUPS'),plans=extract('LINEUPS','WINDOWS');
const winStart=source.indexOf('const WINDOWS='),winEnd=source.indexOf(';\n',winStart);
const windows=JSON.parse(source.slice(winStart+'const WINDOWS='.length,winEnd));
test('field mode is distinct from indoor mode and has six accurate annotated blocks',()=>{
 assert.equal(plans.length,6);assert.deepEqual(windows,[[0,12],[12,24],[24,35],[35,47],[47,59],[59,70]]);
 assert.match(source,/href="https:\/\/pw-mo14-1\.netlify\.app\/zaalplanner\/"/);
 assert.match(source,/href="https:\/\/pw-mo14-1\.netlify\.app\/veldplanner\/"/);
 assert.match(source,/#printAll\{display:block!important\}/);
 assert.match(source,/id="png"/);assert.match(source,/id="pdf"/);
});
test('Jackie is GK all match; Coco-Mijn exclusively forward or on bench',()=>{
 const positions=['LV','RV','AM','LM','RM','VM','LA','LC','RC','RA','K'];
 for(const [i,plan] of plans.entries()){
  assert.equal(plan.K,'Jackie');
  assert.deepEqual(Object.keys(plan).sort(),positions.slice().sort());
  assert.equal(Object.values(plan).length,11);
  assert.equal(new Set(Object.values(plan)).size,11);
  assert.notEqual(plan.LC,'Isis');assert.notEqual(plan.RC,'Isis');
  assert.notEqual(plan.LC,'Eline');assert.notEqual(plan.RC,'Eline');
  const copo=Object.entries(plan).filter(([position,name])=>name==='Coco-Mijn').map(([position])=>position);
  assert.ok(copo.length===0||copo.every(p=>p==='LV'||p==='RV'), 'Coco must play attack only in block '+(i+1));
  const onBench=Object.keys(roster).filter(name=>!Object.values(plan).includes(name));
  assert.equal(onBench.length,2);
  if(i>0){const previous=new Set(Object.values(plans[i-1])),current=new Set(Object.values(plan));assert.equal([...previous].filter(x=>!current.has(x)).length,2);assert.equal([...current].filter(x=>!previous.has(x)).length,2);}
 }
 assert.equal(plans[0].LV,'Nine');assert.equal(plans[0].RV,'Coco-Mijn');
});
test('field playing minutes balance and names appear exactly once on bench',()=>{
 const min=Object.fromEntries(Object.keys(roster).map(name=>[name,0])),bank=new Map();
 for(let i=0;i<plans.length;i++){
  const duration=windows[i][1]-windows[i][0];
  for(const name of Object.values(plans[i]))min[name]+=duration;
  for(const name of Object.keys(roster).filter(x=>!Object.values(plans[i]).includes(x)))bank.set(name,(bank.get(name)||0)+1);
 }
 assert.equal(min.Jackie,70);
 for(const name of Object.keys(roster).filter(x=>x!=='Jackie')){assert.ok([58,59].includes(min[name]),name);assert.equal(bank.get(name),1,name);}
});
test('static inline JavaScript parses so the 6-card field app is interactive',()=>{
 const js=source.slice(source.indexOf('<script>')+8,source.indexOf('</script>'));
 assert.doesNotThrow(()=>new Function(js));
});
