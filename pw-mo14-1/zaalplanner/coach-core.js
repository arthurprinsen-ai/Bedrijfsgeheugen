/* PW MO14 Zaalcoach — first lineup, position preferences and cumulative season fairness. */
(function(){
'use strict';
const POSITIONS=['AL','AR','M','VL','VR'];
const ROLE={AL:'A',AR:'A',M:'M',VL:'V',VR:'V'};
function variance(values){if(!values.length)return 0;const mean=values.reduce((a,b)=>a+b,0)/values.length;return values.reduce((sum,v)=>sum+(v-mean)*(v-mean),0)/values.length;}
function choose(items,count){if(count===0)return [[]];if(count===items.length)return [items.slice()];const out=[];function step(i,bag){if(bag.length===count){out.push(bag.slice());return;}for(let j=i;j<=items.length-(count-bag.length);j++){bag.push(items[j]);step(j+1,bag);bag.pop();}}step(0,[]);return out;}
function seededRand(seed){let t=seed>>>0;return function(){t+=0x6D2B79F5;let x=t;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
function shuffle(arr,rng){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function compute(index){
 const match=state.matches[index],available=state.roster.filter(p=>!match.absent.includes(p.id));
 const keeper=available.find(p=>p.id===match.keeper);
 if(!keeper)return {error:'Kies een aanwezige keeper.'};
 const pins=match.firstLineup&&typeof match.firstLineup==='object'?match.firstLineup:{};
 const pinnedIds=POSITIONS.map(pos=>pins[pos]).filter(Boolean);
 if(new Set(pinnedIds).size!==pinnedIds.length)return {error:'Dezelfde speelster staat op twee plekken in de eerste opstelling.'};
 for(const id of pinnedIds){if(id===keeper.id)return {error:'De keeper staat ook op het veld. Kies een andere keeper of positie.'};if(!available.some(p=>p.id===id))return {error:'Een vastgezette speelster is afwezig. Pas de eerste opstelling aan.'};}
 const forced=new Set(pinnedIds),pool=available.filter(p=>p.id!==keeper.id&&(p.roles.length>0||forced.has(p.id)));
 const reserveOnly=available.filter(p=>p.id!==keeper.id&&!pool.some(q=>q.id===p.id));
 const n=pool.length,step=Number(state.step),half=Number(state.half),total=half*2;
 if(n<5)return {error:'Er zijn minimaal vijf beschikbare veldspeelsters nodig.'};
 if(available.length>12)return {error:'Maximaal 12 speelsters (inclusief keeper).'};
 if(!Number.isFinite(step)||step<=0||half%step!==0)return {error:'De bloklengte moet in een helft passen.'};
 const B=total/step,swaps=Math.min(5,n-5),holds=5-swaps;
 const rng=seededRand(42281+index*15241+pool.reduce((a,p)=>a+p.id.length*17,0));
 const allIds=state.roster.map(p=>p.id);
 const baseField=Object.fromEntries(state.roster.map(p=>[p.id,0]));
 const baseTotal=Object.fromEntries(state.roster.map(p=>[p.id,0]));
 const firstSetHistory=new Set();
 for(let i=0;i<index;i++){
  const hist=cache[i],prior=state.matches[i];if(!hist||hist.error)continue;
  const confirmed=Boolean(prior.actualConfirmed&&prior.actualField&&prior.actualGoal);
  for(const q of state.roster){
   const plannedField=hist.pool.some(p=>p.id===q.id)?(hist.counts[q.id]||0)*hist.step:0;
   const plannedGoal=hist.keeper.id===q.id?hist.total:0;
   const recordedField=Number(prior.actualField?.[q.id]);
   const recordedGoal=Number(prior.actualGoal?.[q.id]);
   const field=confirmed&&Number.isFinite(recordedField)?recordedField:plannedField;
   const goal=confirmed&&Number.isFinite(recordedGoal)?recordedGoal:plannedGoal;
   baseField[q.id]+=field;
   baseTotal[q.id]+=field+goal;
  }
  if(hist.sets?.[0])firstSetHistory.add(hist.sets[0].map(p=>p.id).sort().join('|'));
 }
 function score(counts,round,firstSet){
  const totals=allIds.map(id=>(baseTotal[id]||0)+(id===keeper.id?total:0)+(counts[id]||0)*step);
  const current=pool.map(p=>counts[p.id]||0);
  const meanSlots=5*round/n;
  const dispersion=current.reduce((a,x)=>a+(x-meanSlots)*(x-meanSlots),0);
  const sig=firstSet.map(p=>p.id).sort().join('|');
  const seasonField=pool.map(p=>(baseField[p.id]||0)+(counts[p.id]||0)*step);
  return variance(seasonField)*100+variance(totals)*1.1+dispersion*30+(firstSetHistory.has(sig)?200:0);
 }
 function startOptions(){
  const pinned=pool.filter(p=>forced.has(p.id));
  if(pinned.length===5)return [pinned];
  const rest=pool.filter(p=>!forced.has(p.id));const out=[],seen=new Set();
  const first=choose(rest,5-pinned.length);
  for(const option of first){const group=[...pinned,...option];const sig=group.map(p=>p.id).sort().join('|');if(seen.has(sig))continue;seen.add(sig);out.push(group);}
  out.sort((a,b)=>score(Object.fromEntries(a.map(p=>[p.id,1])),1,a)-score(Object.fromEntries(b.map(p=>[p.id,1])),1,b));
  return out.slice(0,48);
 }
 let best=null;
 for(const first of startOptions()){
  const begin=Object.fromEntries(pool.map(p=>[p.id,first.some(x=>x.id===p.id)?1:0]));
  let beams=[{groups:[first],counts:begin}];
  for(let b=1;b<B;b++){
   const candidates=[];
   for(const path of beams){
    const prev=path.groups[path.groups.length-1];const bench=pool.filter(p=>!prev.some(q=>q.id===p.id));
    const variants=bench.length>=5?choose(bench,5):choose(prev,holds).map(keep=>[...bench,...keep]);
    for(const next of variants){
     const counts={...path.counts};next.forEach(p=>counts[p.id]=(counts[p.id]||0)+1);
     candidates.push({groups:[...path.groups,next],counts,rank:score(counts,b+1,first)});
    }
   }
   candidates.sort((a,b)=>a.rank-b.rank);
   beams=candidates.slice(0,(n<=7?180:n<=9?64:36));
   if(!beams.length)break;
  }
  for(const path of beams){
   const per=pool.map(p=>path.counts[p.id]);
   if(Math.max(...per)-Math.min(...per)>1)continue;
   const totalScore=score(path.counts,B,first)+rng()*.004;
   if(best&&totalScore>=best.cost)continue;
   best={cost:totalScore,groups:path.groups,counts:path.counts};
  }
 }
 if(!best)return {error:'Geen eerlijk schema mogelijk binnen deze blokindeling. Pas de eerste vijf of de blokduur aan.'};
 const blocksOut=[],misfits=[];let last={};
 for(let i=0;i<best.groups.length;i++){
  const members=best.groups[i],locked=i===0?pins:null;
  const assigned=bestAssignment(members,last,locked);
  if(!assigned.map)return {error:'De gekozen eerste opstelling bevat onmogelijke posities.'};
  const map=assigned.map,next=best.groups[i+1];
  const outs=next?members.filter(p=>!next.some(q=>q.id===p.id)):[];
  const ins=next?next.filter(p=>!members.some(q=>q.id===p.id)):[];
  const stays=next?members.filter(p=>next.some(q=>q.id===p.id)):[];
  const bench=[...pool.filter(p=>!members.some(q=>q.id===p.id)),...reserveOnly];
  POSITIONS.forEach(pos=>{if(!map[pos].roles.includes(ROLE[pos]))misfits.push({block:i,name:map[pos].name,pos});});
  blocksOut.push({number:i+1,start:i*step,end:(i+1)*step,map,members,bench,outs,ins,stays});
  last=map;
 }
 return {...best,keeper,pool,reserveOnly,step,total,half,maxSwaps:swaps,playersStaying:holds,misfits,blocks:blocksOut,sets:best.groups};
}
window.MO14CoachEngine={compute,choose,variance};
rotationsFor=compute;cache={};
})();