/* Veldhockey: live, auditable substitutions. Pure logic, no network or timers. */
(function(root){
'use strict';
const E=root.PWFieldEngine;
if(!E)throw Error('PWFieldEngine required for live substitutions');
const positions=E.POS;
const people=E.players();
const empty=(list)=>Object.fromEntries(list.map(name=>[name,0]));
function fail(message){return {error:message};}
function start(plan){
 if(!plan||plan.error||!plan.blocks||!plan.blocks.length)return fail('Kies eerst een geldige veldopstelling.');
 const initial={};for(const pos of positions)initial[pos]=plan.blocks[0].map[pos];
 return {version:1,minute:0,initial,keeper:plan.keeper,events:[],finished:false};
}
function replay(live,absent=[]){
 if(!live||live.version!==1||!Number.isInteger(live.minute)||live.minute<0||live.minute>70||!Array.isArray(live.events)||live.events.length>160)return fail('Ongeldige live-wedstrijdstand.');
 const map={};const used=new Set();
 for(const pos of positions){
  const name=live.initial?.[pos];if(!people.includes(name)||used.has(name)||!E.hardAllowed(name,pos))return fail('Controleer de vastgelegde beginopstelling.');
  used.add(name);map[pos]=name;
 }
 if(!people.includes(live.keeper)||live.keeper==='Coco-Mijn'||used.has(live.keeper)||absent.includes(live.keeper))return fail('Ongeldige keeper.');
 if([...used].some(name=>absent.includes(name)))return fail('Een live-opgestelde speelster staat als afwezig.');
 const field=empty(people),goal=empty(people),entered=empty(people),exited=empty(people);
 let last=0;
 function addSpan(minutes){for(const p of positions)field[map[p]]+=minutes;goal[live.keeper]+=minutes;}
 for(const [index,event] of live.events.entries()){
  if(!event||!Number.isInteger(event.minute)||event.minute<last||event.minute>live.minute||!positions.includes(event.position)||!people.includes(event.out)||!people.includes(event.in))return fail('Ongeldig wisselitem '+(index+1)+'.');
  if(map[event.position]!==event.out)return fail('De speelster staat niet meer op deze positie.');
  if(used.has(event.in)||event.in===live.keeper||absent.includes(event.in)||!E.hardAllowed(event.in,event.position))return fail('Wissel niet toegestaan op '+event.position+'.');
  addSpan(event.minute-last);last=event.minute;
  used.delete(event.out);used.add(event.in);map[event.position]=event.in;
  exited[event.out]++;entered[event.in]++;
 }
 addSpan(live.minute-last);
 const bench=people.filter(name=>name!==live.keeper&&!absent.includes(name)&&!used.has(name));
 return {minute:live.minute,map,bench,keeper:live.keeper,field,goal,entered,exited,events:live.events.slice(),finished:live.finished===true,totalSwaps:live.events.length};
}
function clock(live,minute,absent=[]){
 if(!Number.isInteger(minute)||minute<0||minute>70)return fail('Vul een minuut in tussen 0 en 70.');
 const previous=replay(live,absent);if(previous.error)return previous;
 const last=live.events.length?live.events[live.events.length-1].minute:0;
 if(minute<last)return fail('Deze minuut ligt vóór een geregistreerde wissel. Verwijder eerst de latere wissel.');
 if(live.finished)return fail('De wedstrijd is al afgesloten.');
 const result={...live,minute};return replay(result,absent).error?fail('Ongeldige wedstrijdstand.'):result;
}
function substitute(live,position,incoming,absent=[]){
 const current=replay(live,absent);if(current.error)return current;
 if(current.finished||live.minute===70)return fail('De wedstrijd is afgelopen.');
 if(!positions.includes(position))return fail('Kies een geldige veldpositie.');
 if(!current.bench.includes(incoming))return fail('Kies een beschikbare speelster op de bank.');
 if(!E.hardAllowed(incoming,position))return fail('Deze speelster mag niet op deze positie spelen.');
 const out=current.map[position];if(!out)return fail('Geen speelster op deze positie.');
 const result={...live,events:[...live.events,{minute:live.minute,position,out,in:incoming}]};
 const checked=replay(result,absent);return checked.error?checked:result;
}
function undo(live,absent=[]){
 if(!live?.events?.length)return fail('Er zijn geen wissels om ongedaan te maken.');
 if(live.finished)return fail('Haal eerst de eindregistratie weg.');
 const result={...live,events:live.events.slice(0,-1)};
 const checked=replay(result,absent);return checked.error?checked:result;
}
function finalize(live,absent=[]){
 if(live?.minute!==70)return fail('Zet de wedstrijdklok eerst op minuut 70.');
 const result={...live,finished:true},calc=replay(result,absent);
 if(calc.error)return calc;
 if(Object.values(calc.field).reduce((a,b)=>a+b,0)!==700||Object.values(calc.goal).reduce((a,b)=>a+b,0)!==70)return fail('De speelminuten tellen niet correct op.');
 return {live:result,actual:{confirmed:true,field:calc.field,goal:calc.goal}};
}
function advice(live,absent=[]){
 const current=replay(live,absent);if(current.error||current.finished||!current.bench.length)return null;
 const options=[];
 for(const player of current.bench)for(const pos of positions){
  const out=current.map[pos];
  if(!E.hardAllowed(player,pos))continue;
  const imbalance=current.field[out]-current.field[player];
  options.push({position:pos,out,in:player,minute:current.minute,imbalance});
 }
 options.sort((a,b)=>b.imbalance-a.imbalance||people.indexOf(a.in)-people.indexOf(b.in));
 return options[0]||null;
}
root.PWFieldLiveEngine={start,replay,clock,substitute,undo,finalize,advice};
})(window);
