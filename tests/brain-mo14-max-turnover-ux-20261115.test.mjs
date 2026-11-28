import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync('pw-mo14-1/zaalplanner/index.html','utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>',html.indexOf('<script>')));
const start=script.indexOf('function seeded(n)');
const end=script.indexOf('function matchData()',start);
assert.ok(start>=0&&end>start,'must locate actual production rotation implementation');
const engine=script.slice(start,end);
function makeEngine(n,matchCount=1){
 const field=Array.from({length:n},(_,i)=>({id:'player'+i,name:'Speelster '+i,num:i+1,roles:['A','M','V']}));
 const roster=[{id:'coco',name:'Coco',num:10,roles:[]},...field];
 const state={roster,half:20,step:10,rotation:'balanced',matches:Array.from({length:matchCount},()=>({absent:[],keeper:'coco',date:'2026-12-06'}))};
 const cache={};
 const make=new Function('state','cache','ALLPOS','POSROLE',engine+'\nreturn {getPlan,rotationsFor};');
 return {state,cache,...make(state,cache,['AL','AR','M','VL','VR'],p=>p[0]==='A'?'A':p[0]==='V'?'V':'M')};
}
test('actual planner syntax and 10-minute four-block default',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/half:20,step:10/);
 assert.match(html,/rotationEngineVersion:3/);
 assert.match(html,/let st=5;/);
 assert.match(html,/id="switchSummary"/);
 assert.match(html,/id="rotationHint"/);
});
test('each transition exchanges mathematically maximum field players and names who stays',()=>{
 for(let n=5;n<=11;n++){
   const {getPlan}=makeEngine(n);const p=getPlan(0);
   assert.ok(!p.error,'n='+n+' error '+p.error);
   assert.equal(p.blocks.length,4,'four ten-minute blocks, n='+n);
   const swaps=Math.min(5,n-5);
   assert.equal(p.maxSwaps,swaps);
   assert.equal(p.playersStaying,5-swaps);
   for(let b=0;b<4;b++){
     const group=p.blocks[b];
     assert.equal(group.members.length,5);
     assert.equal(new Set(group.members.map(q=>q.id)).size,5);
     assert.equal(group.bench.length,n-5);
     assert.equal(group.start,b*10);assert.equal(group.end,(b+1)*10);
     if(b<3){
       assert.equal(group.outs.length,swaps,'OUT n='+n+' block='+b);
       assert.equal(group.ins.length,swaps,'IN n='+n+' block='+b);
       assert.equal(group.stays.length,5-swaps,'STAY n='+n+' block='+b);
       assert.ok(group.ins.every(q=>group.bench.some(z=>z.id===q.id)),'incoming girls came from bench');
     }
   }
   const counts=Object.values(p.counts);
   assert.equal(counts.reduce((a,b)=>a+b,0),20,'20 total field blocks');
   assert.ok(Math.max(...counts)-Math.min(...counts)<=1,'minutes differ by at most 10 min');
   assert.ok(Math.min(...counts)>0,'everyone fields at least one block');
 }
});
test('nine field players: four exchange each time, one remains, 20–30 minutes each',()=>{
 const {getPlan}=makeEngine(9);const p=getPlan(0);
 assert.equal(p.maxSwaps,4);assert.equal(p.playersStaying,1);
 assert.deepEqual(p.blocks.slice(0,-1).map(b=>b.stays.length),[1,1,1]);
 const vals=Object.values(p.counts).sort((a,b)=>a-b);
 assert.deepEqual(vals,[2,2,2,2,2,2,2,3,3]);
 assert.equal(p.keeper.name,'Coco');assert.equal(p.total,40);
});
test('different starting blocks rotate across twelve fixtures',()=>{
 const {getPlan}=makeEngine(9,12),starts=new Set();
 for(let i=0;i<12;i++){const p=getPlan(i);assert.ok(!p.error);const sig=p.sets[0].map(x=>x.id).sort().join('|');assert.ok(!starts.has(sig),'duplicate opening five on match '+i);starts.add(sig)}
});
test('small-screen day layout uses full width and one fixture per row',()=>{
 assert.match(html,/\.home-rounds\{display:block!important/);
 assert.match(html,/\.fixture-cards\{grid-template-columns:minmax\(0,1fr\)!important/);
 assert.match(html,/@media\(max-width:720px\)/);
 assert.match(html,/\.fixture-day-header\{grid-template-columns:minmax\(0,1fr\)/);
 assert.match(html,/box-sizing:border-box/);
 assert.match(html,/env\(safe-area-inset-bottom\)/);
 assert.match(html,/BLIJFT STAAN/);
 assert.match(html,/voorkeurslinie/);
});
