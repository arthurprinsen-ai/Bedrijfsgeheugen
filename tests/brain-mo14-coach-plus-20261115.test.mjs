import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const path='pw-mo14-1/zaalplanner/';
const source=readFileSync(path+'coach-core.js','utf8');
const ui=readFileSync(path+'coach-ui.js','utf8');
const html=readFileSync(path+'index.html','utf8');
const css=readFileSync(path+'coach-plus.css','utf8');
const sw=readFileSync(path+'sw.js','utf8');
function makeGame(fieldCount=9,numGames=12,keeper='coco'){
 const roster=[{id:'coco',name:'Coco',num:10,roles:[]}];
 for(let i=0;i<fieldCount;i++)roster.push({id:'f'+i,name:'F'+i,num:i+1,roles:['A','M','V']});
 const state={roster,half:20,step:10,rotation:'balanced',matches:Array.from({length:numGames},()=>({keeper,absent:[],fixtureId:'fixture'}))};
 const cache={};const ctx=vm.createContext({window:{},state,cache,bestAssignment:(members,last,locked)=>{const pos=['AL','AR','M','VL','VR'],used=new Set(),map={};
 for(const p of pos)if(locked?.[p]){const q=members.find(x=>x.id===locked[p]);if(!q)return {map:null};map[p]=q;used.add(q.id);}
 for(const p of pos)if(!map[p]){const q=members.find(x=>!used.has(x.id));map[p]=q;used.add(q.id);}
 return {map,cost:0};},rotationsFor:()=>{}});
 vm.runInContext(source,ctx);
 return {ctx,state,cache,plan:i=>{const p=ctx.window.MO14CoachEngine.compute(i);ctx.cache[i]=p;return p;}};
}
test('v8 scripts are syntactically valid, linked by the real app and cached offline',()=>{
 assert.doesNotThrow(()=>new Function(source));assert.doesNotThrow(()=>new Function(ui));
 for(const name of ['coach-core.js','coach-ui.js','coach-plus.css']){assert.ok(html.includes(name),'missing asset '+name);assert.ok(sw.includes(name),'offline not cached: '+name);}
 assert.match(sw,/mo14-zaalcoach-v8-coachboard/);
 assert.match(css,/touch-action:none/);
 assert.match(ui,/pointerdown/);assert.match(ui,/pointermove/);assert.match(ui,/pointercancel/);
 assert.match(ui,/coachUndo/);assert.match(ui,/coachRedo/);
 assert.match(ui,/coachNotes/);assert.match(ui,/coachDownloadBoard/);
});
test('keeper plus five field roles, maximally swappable with even block minutes',()=>{
 for(let n=5;n<=11;n++){
  const g=makeGame(n,12);for(let i=0;i<12;i++){const p=g.plan(i);
   assert.ok(!p.error,'n='+n+' game='+i+': '+p.error);
   assert.equal(p.blocks.length,4);
   const allowed=Math.min(5,n-5);
   for(let b=0;b<4;b++){const x=p.blocks[b];assert.equal(x.members.length,5);
    assert.equal(x.start,b*10);assert.equal(x.end,(b+1)*10);
    if(b<3){assert.equal(x.outs.length,allowed);assert.equal(x.ins.length,allowed);assert.equal(x.stays.length,5-allowed);}
   }
   const c=Object.values(p.counts);
   assert.ok(Math.max(...c)-Math.min(...c)<=1,'equal as possible within game');
  }
  const all=g.state.roster.slice(1).map(person=>g.state.matches.reduce((sum,_,i)=>sum+(g.ctx.cache[i].counts[person.id]||0)*10,0));
  assert.ok(Math.max(...all)-Math.min(...all)<=10,'season field-minute spread <= one 10-minute block for n='+n);
 }
});
test('manual first-five is fixed at exact positions and subsequent blocks still rotate',()=>{
 const g=makeGame(9,2),names=['f0','f1','f2','f3','f4'];
 const m=g.state.matches[0];m.firstLineup={AL:names[0],AR:names[1],M:names[2],VL:names[3],VR:names[4]};
 const p=g.plan(0);assert.ok(!p.error,p.error);
 for(const [pos,id] of Object.entries(m.firstLineup))assert.equal(p.blocks[0].map[pos].id,id);
 assert.deepEqual(Array.from(p.blocks.slice(0,-1),b=>b.stays.length),[1,1,1]);
 assert.deepEqual(Array.from(p.blocks.slice(0,-1),b=>b.ins.length),[4,4,4]);
 const q=g.plan(1);assert.ok(!q.error);assert.notEqual(Array.from(q.sets[0],x=>x.id).sort().join('|'),Array.from(p.sets[0],x=>x.id).sort().join('|'));
});
test('conflicting manual positions and missing field players fail explicitly',()=>{
 const g=makeGame(8,1);g.state.matches[0].firstLineup={AL:'f0',AR:'f0'};
 assert.match(g.plan(0).error,/twee plekken/);
 g.state.matches[0].firstLineup={AL:'coco'};
 assert.match(g.plan(0).error,/keeper/);
});
test('app supports strong group, per-match notes, drawing, PNG export and fairness explanation',()=>{
 for(const name of ['tess','cato','eline','lidewij','coco'])assert.ok(ui.includes(name));
 for(const token of ['coachFirstPositions','coachStrong','coachRelease','coachFairRows','coachFairSummary','screen-tactics','coachNotes','coachBoard','coachDownloadNotes','coachCopyNotes','coachDownloadBoard','data-coach-tool="move"','data-coach-tool="arrow"','data-coach-tool="pen"'])assert.ok(ui.includes(token),token);
 assert.ok(ui.includes('window.PWCoachPlus'));
 assert.ok(ui.includes('save()'));
 assert.ok(ui.includes('VIEW_IDS.push'));
});
