import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const dir='pw-mo14-1/zaalplanner/';
const engine=readFileSync(dir+'field-engine.js','utf8');
const live=readFileSync(dir+'field-live-engine.js','utf8');
const ui=readFileSync(dir+'field-live.js','utf8');
const html=readFileSync(dir+'index.html','utf8');
const css=readFileSync(dir+'field-live.css','utf8');
const sw=readFileSync(dir+'sw.js','utf8');
function harness(){const window={};vm.runInNewContext(engine,{window,structuredClone},{timeout:3500});vm.runInNewContext(live,{window},{timeout:3500});return {E:window.PWFieldEngine,L:window.PWFieldLiveEngine};}
function asPlain(data){return JSON.parse(JSON.stringify(data));}
test('live app is loaded after the unified field engine and before closing HTML, with offline assets',()=>{
 assert.doesNotThrow(()=>new Function(ui));
 const assets=['field-live-engine.js','field-live.js','field-live.css'];
 for(const name of assets){assert.ok(html.includes('./'+name),name);assert.ok(sw.includes("'./"+name+"'"),name);}
 assert.ok(html.indexOf('field-complete.js')<html.indexOf('field-live-engine.js'));
 assert.ok(html.indexOf('field-live-engine.js')<html.indexOf('field-live.js'));
 assert.match(sw,/mo14-unified-coach-v11-live-wissels/);
 assert.match(css,/@media\(max-width:650px\)/);
 assert.match(css,/min-height:48px/);
});
test('Jackie stays goalkeeper, Coco starts forward, and field snapshot has ten positions and two on bench',()=>{
 const {E,L}=harness(),m=E.makeModel(),p=E.planOne(m,0);
 assert.ok(!p.error,p.error);const start=L.start(p),v=L.replay(start,m.matches[0].absent);
 assert.ok(!v.error,v.error);assert.equal(v.keeper,'Jackie');assert.equal(v.map.RV,'Coco-Mijn');assert.equal(v.map.LV,'Nine');assert.equal(Object.keys(v.map).length,10);
 assert.equal(v.bench.length,2);assert.deepEqual(asPlain(v.bench),['Bobbi','Femke']);
 assert.equal(Object.values(v.field).reduce((a,b)=>a+b,0),0);
});
test('unscripted switch at minute 8 updates exact field, bench, and IN/OUT counts; undo restores',()=>{
 const {E,L}=harness(),m=E.makeModel(),p=E.planOne(m,0);
 let live=L.clock(L.start(p),8);assert.ok(!live.error);
 live=L.substitute(live,'LA','Bobbi');assert.ok(!live.error,live.error);
 let v=L.replay(live);assert.equal(v.map.LA,'Bobbi');assert.ok(v.bench.includes('Isis'));assert.ok(!v.bench.includes('Bobbi'));
 assert.equal(v.exited.Isis,1);assert.equal(v.entered.Bobbi,1);assert.equal(v.entered.Isis,0);assert.equal(v.exited.Bobbi,0);
 live=L.clock(live,19);v=L.replay(live);
 assert.equal(v.field.Isis,8);assert.equal(v.field.Bobbi,11);assert.equal(v.goal.Jackie,19);assert.equal(Object.values(v.field).reduce((a,b)=>a+b,0),190);
 live=L.undo(live);v=L.replay(live);assert.equal(v.events.length,0);assert.equal(v.map.LA,'Isis');assert.equal(v.field.Isis,19);assert.equal(v.exited.Isis,0);assert.equal(v.entered.Bobbi,0);
});
test('second substitution updates both counters and known players total on/off episodes',()=>{
 const {E,L}=harness();let live=L.clock(L.start(E.planOne(E.makeModel(),0)),12);
 live=L.substitute(live,'LA','Bobbi');live=L.clock(live,23);
 live=L.substitute(live,'LA','Isis');live=L.clock(live,29);
 const v=L.replay(live);assert.equal(v.events.length,2);assert.equal(v.entered.Isis,1);assert.equal(v.exited.Isis,1);assert.equal(v.entered.Bobbi,1);assert.equal(v.exited.Bobbi,1);
 assert.equal(v.field.Isis,18);assert.equal(v.field.Bobbi,11);assert.equal(v.goal.Jackie,29);
});
test('hard roles, bench membership and changing past timestamps fail closed with no mutation',()=>{
 const {E,L}=harness();let live=L.start(E.planOne(E.makeModel(),0));
 const offensive=L.substitute(live,'RV','Femke');assert.ok(!offensive.error);
 assert.match(L.substitute(offensive,'LA','Coco-Mijn').error,/positie/);
 const defensive=L.substitute(live,'LA','Bobbi');assert.ok(!defensive.error);
 assert.match(L.substitute(defensive,'LC','Isis').error,/positie/);
 // A playing preference is advisory: Femke is allowed at central defense if a coach decides.
 assert.ok(!L.substitute(live,'LC','Femke').error);
 assert.match(L.substitute(live,'LV','Jackie').error,/bank/);
 assert.match(L.clock(live,71).error,/tussen 0 en 70/);
 live=L.clock(live,16);live=L.substitute(live,'LA','Bobbi');
 assert.match(L.clock(live,9).error,/vóór/);
 assert.match(L.substitute(live,'LA','Bobbi').error,/bank/);
 assert.equal(live.events.length,1);
});
test('complete 70-minute match computes 700 field and 70 keeper minutes; then locks all changes',()=>{
 const {E,L}=harness();let live=L.start(E.planOne(E.makeModel(),0));live=L.clock(live,20);live=L.substitute(live,'LA','Bobbi');live=L.clock(live,70);
 const done=L.finalize(live);assert.ok(!done.error,done.error);
 assert.equal(done.actual.confirmed,true);
 assert.equal(Object.values(done.actual.field).reduce((a,b)=>a+b,0),700);
 assert.equal(Object.values(done.actual.goal).reduce((a,b)=>a+b,0),70);
 assert.equal(done.actual.goal.Jackie,70);
 assert.equal(done.actual.field.Isis,20);assert.equal(done.actual.field.Bobbi,50);
 assert.match(L.substitute(done.live,'LA','Isis').error,/afgelopen/);
 assert.match(L.undo(done.live).error,/eindregistratie/);
});
test('bounded validated JSON sanitizer preserves valid log and rejects forged or injected events',()=>{
 const {E,L}=harness();const base=E.makeModel();let l=L.clock(L.start(E.planOne(base,0)),12);l=L.substitute(l,'LA','Bobbi');
 base.matches[0].live=l;
 const saved=E.sanitize(base);
 assert.equal(saved.matches[0].live.events.length,1);assert.equal(saved.matches[0].live.initial.RV,'Coco-Mijn');
 const corrupted=asPlain(base);corrupted.matches[0].live.events[0].in='<script>alert(1)</script>';
 assert.equal(E.sanitize(corrupted).matches[0].live,null);
 const duplicate=asPlain(base);duplicate.matches[0].live.events[0].in='Jackie';
 assert.equal(E.sanitize(duplicate).matches[0].live,null);
});
test('live UI shows explicit manual change, per-player counts, undo, match-specific CSV and actual confirmation',()=>{
 for(const marker of ['fieldLiveCoach','flOut','flIn','flMinute','flSwap','flUndo','flCounts','flLog','flCsv','flFinish','flReset','L.substitute','L.clock','L.undo','L.finalize','actual=r.actual','fieldCoachV2=E.sanitize','role="status"'])assert.ok(ui.includes(marker),'UI requirement missing: '+marker);
 assert.doesNotMatch(ui,/fetch\(|XMLHttpRequest|eval\(|new Function/);
});
