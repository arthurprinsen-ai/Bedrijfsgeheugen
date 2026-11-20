/* PW Coach field mode: independent 11-a-side planning, shared app state. */
(function(root){
'use strict';
const POS=['LA','LC','RC','RA','VM','LM','RM','AM','LV','RV'];
const LABEL={LA:'Linksachter',LC:'Centraal links',RC:'Centraal rechts',RA:'Rechtsachter',VM:'Verdedigend midden',LM:'Linksmidden',RM:'Rechtsmidden',AM:'Aanvallend midden',LV:'Linksvoor',RV:'Rechtsvoor'};
const GROUP=p=>['LA','LC','RC','RA'].includes(p)?'A':['LV','RV'].includes(p)?'V':'M';
const DEFAULT_PREFS={'Jackie':['A','M','V'],'Coco-Mijn':['V'],Isis:['A'],Cato:['A'],Tess:['A'],Ella:['A','M'],Bobbi:['A','M'],Eline:['M'],Steffie:['M'],Lidewij:['M','V'],Lizzy:['M','V'],Nine:['V'],Femke:['V']};
const DEF_WINDOWS=[[0,12],[12,24],[24,35],[35,47],[47,59],[59,70]];
const FIRST={LA:'Isis',LC:'Cato',RC:'Tess',RA:'Ella',VM:'Eline',LM:'Steffie',RM:'Lizzy',AM:'Lidewij',LV:'Nine',RV:'Coco-Mijn'};
function makeModel(){return {version:2,selectedMatch:0,selectedBlock:0,windows:DEF_WINDOWS.map(v=>v.slice()),prefs:structuredClone(DEFAULT_PREFS),matches:[{fixtureId:'field-1',date:'',time:'',opponent:'',keeper:'Jackie',absent:[],first:{...FIRST},notes:'',board:[],actual:null}]};}
function players(){return Object.keys(DEFAULT_PREFS);}
function hardAllowed(name,p){return !(name==='Coco-Mijn'&&GROUP(p)!=='V')&&!(name==='Isis'&&(p==='LC'||p==='RC'))&&!(name==='Eline'&&(p==='LC'||p==='RC'));}
function sanitize(model){
 if(!model||!Array.isArray(model.matches)||model.matches.length<1||model.matches.length>60)return makeModel();
 const fresh=makeModel(),prefs={};for(const name of players()){const v=model.prefs?.[name];prefs[name]=Array.isArray(v)?v.filter(x=>['A','M','V'].includes(x)).slice(0,3):fresh.prefs[name];if(!prefs[name].length)prefs[name]=fresh.prefs[name];}
 const w=Array.isArray(model.windows)?model.windows:DEF_WINDOWS;const valid=w.length>=2&&w.length<=14&&w.every((x,i)=>Array.isArray(x)&&x.length===2&&Number.isInteger(x[0])&&Number.isInteger(x[1])&&x[0]>=0&&x[1]<=70&&x[1]>x[0]&&(i===0?x[0]===0:x[0]===w[i-1][1]))&&w[w.length-1][1]===70;
 const matches=model.matches.map((m,i)=>{
  const base={...fresh.matches[0],fixtureId:'field-'+(i+1)};if(!m||typeof m!=='object')return base;
  base.fixtureId=typeof m.fixtureId==='string'&&/^[a-zA-Z0-9_-]{1,48}$/.test(m.fixtureId)?m.fixtureId:base.fixtureId;
  for(const key of ['date','time','opponent','notes'])if(typeof m[key]==='string')base[key]=m[key].slice(0,key==='notes'?5000:key==='opponent'?80:16);
  base.keeper=players().includes(m.keeper)&&m.keeper!=='Coco-Mijn'?m.keeper:'Jackie';
  base.absent=Array.isArray(m.absent)?[...new Set(m.absent.filter(n=>players().includes(n)))]:[];
  if(m.first&&typeof m.first==='object'){base.first={};for(const pos of POS)if(typeof m.first[pos]==='string'&&players().includes(m.first[pos]))base.first[pos]=m.first[pos];}
  if(m.actual&&typeof m.actual==='object'&&m.actual.confirmed===true){const field={},goal={};for(const name of players()){field[name]=Number(m.actual.field?.[name]||0);goal[name]=Number(m.actual.goal?.[name]||0);}if(Object.values(field).every(v=>Number.isInteger(v)&&v>=0&&v<=70)&&Object.values(goal).every(v=>Number.isInteger(v)&&v>=0&&v<=70)&&Object.values(field).reduce((a,b)=>a+b,0)===700&&Object.values(goal).reduce((a,b)=>a+b,0)===70)base.actual={confirmed:true,field,goal};}
  base.board=Array.isArray(m.board)?m.board.slice(0,250).filter(st=>st&&['pen','arrow','circle'].includes(st.tool)&&/^#[a-f0-9]{6}$/i.test(st.color||'')&&Array.isArray(st.points)&&st.points.length<=800&&st.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(q=>typeof q==='number'&&Number.isFinite(q)&&q>=0&&q<=1))):[];
  return base;
 });
 return {version:2,selectedMatch:Math.min(matches.length-1,Math.max(0,Number(model.selectedMatch)||0)),selectedBlock:Math.min((valid?w:DEF_WINDOWS).length-1,Math.max(0,Number(model.selectedBlock)||0)),windows:valid?w.map(x=>x.slice()):DEF_WINDOWS.map(x=>x.slice()),prefs,matches};
}
function assignment(names,prior,prefs){
 const arr=names.slice(),memo=new Map();
 function solve(i,mask){
  if(i===POS.length)return {cost:0,mapping:{}};
  const key=i+':'+mask;if(memo.has(key))return memo.get(key);
  const pos=POS[i];let best=null;
  for(let j=0;j<arr.length;j++){if(mask&(1<<j)||!hardAllowed(arr[j],pos))continue;const name=arr[j];
   let cost=(prefs[name]||DEFAULT_PREFS[name]||[]).includes(GROUP(pos))?0:13;
   if(prior){const last=Object.keys(prior).find(p=>prior[p]===name);if(last&&last!==pos)cost+=18;}
   const next=solve(i+1,mask|(1<<j));if(!next)continue;
   const v=cost+next.cost;if(!best||v<best.cost)best={cost:v,mapping:{[pos]:name,...next.mapping}};
  }
  memo.set(key,best);return best;
 }
 return solve(0,0)?.mapping||null;
}
function planOne(model,index,previous=[]){
 const m=model.matches[index];if(!m)return {error:'Wedstrijd niet gevonden'};
 const all=players().filter(x=>!m.absent.includes(x));
 if(!all.includes(m.keeper))return {error:'De gekozen keeper is afwezig. Kies een beschikbare keeper.'};
 if(m.keeper==='Coco-Mijn')return {error:'Coco-Mijn is aanvaller en kan niet als keeper worden gekozen.'};
 const pool=all.filter(x=>x!==m.keeper);if(pool.length<10)return {error:'Minimaal 11 aanwezige speelsters, inclusief keeper, zijn nodig.'};
 const hist=Object.fromEntries(players().map(n=>[n,0]));
 for(const h of previous){if(h.error)continue;for(const n of players())hist[n]+=h.actual?.field?.[n]??h.fieldMinutes?.[n]??0;}
 const first={...m.first};const used=new Set(),warn=[];
 for(const pos of POS){
  const n=first[pos];if(!pool.includes(n)||used.has(n)||!hardAllowed(n,pos)){if(n)warn.push(n+' kon niet op '+LABEL[pos]+' starten.');delete first[pos];}else used.add(n);
 }
 for(const pos of POS)if(!first[pos]){
  const candidates=pool.filter(n=>!used.has(n)&&hardAllowed(n,pos)).sort((a,b)=>(hist[a]-hist[b])||(((model.prefs[a]||[]).includes(GROUP(pos))?0:1)-((model.prefs[b]||[]).includes(GROUP(pos))?0:1))||players().indexOf(a)-players().indexOf(b));
  if(!candidates.length)return {error:'Geen geschikte speelster voor '+LABEL[pos]+'. Controleer aanwezigheid en keeper.',warnings:warn};
  first[pos]=candidates[0];used.add(candidates[0]);
 }
 const counts=Object.fromEntries(players().map(n=>[n,0])),rested=Object.fromEntries(players().map(n=>[n,0]));
 const windows=model.windows,blocks=[];let prevMap=first,active=new Set(Object.values(first));
 for(let i=0;i<windows.length;i++){
  const [start,end]=windows[i],length=end-start,nowNames=Object.values(prevMap);
  nowNames.forEach(n=>counts[n]+=length);
  const b=pool.filter(n=>!active.has(n));b.forEach(n=>rested[n]+=length);
  blocks.push({number:i+1,start,end,map:{...prevMap},members:nowNames,bench:b,outs:[],ins:[],stays:[]});
  if(i===windows.length-1)break;
  const q=b.length;let nextBench=[];
  if(q){
    nextBench=[...active].sort((a,b)=>rested[a]-rested[b]||hist[b]-hist[a]||counts[b]-counts[a]||players().indexOf(a)-players().indexOf(b)).slice(0,q);
  }
  const nextMembers=pool.filter(n=>!nextBench.includes(n));
  const nextMap=assignment(nextMembers,prevMap,model.prefs);if(!nextMap)return {error:'Niet alle veldposities kunnen veilig worden ingevuld.',warnings:warn};
  const nextSet=new Set(nextMembers);
  blocks[i].outs=nowNames.filter(n=>!nextSet.has(n));
  blocks[i].ins=nextMembers.filter(n=>!active.has(n));
  blocks[i].stays=nowNames.filter(n=>nextSet.has(n));
  prevMap=nextMap;active=nextSet;
 }
 const goalMinutes=Object.fromEntries(players().map(n=>[n,n===m.keeper?70:0]));
 const result={keeper:m.keeper,fieldPlayers:pool,fieldMinutes:counts,goalMinutes,blocks,warnings:warn,actual:m.actual,match:m,total:70};
 return result;
}
function planAll(model){const plans=[];for(let i=0;i<model.matches.length;i++)plans.push(planOne(model,i,plans));return plans;}
function totals(model){const plans=planAll(model),sums=Object.fromEntries(players().map(name=>[name,{name,field:0,goal:0,total:0,confirmed:0}]));
 plans.forEach((p,i)=>{if(p.error)return;const act=model.matches[i].actual?.confirmed?model.matches[i].actual:null;
  for(const name of players()){const f=act?act.field[name]:p.fieldMinutes[name],g=act?act.goal[name]:p.goalMinutes[name];sums[name].field+=f;sums[name].goal+=g;sums[name].total+=f+g;if(act)sums[name].confirmed+=f+g;}
 });
 return {plans,rows:Object.values(sums),confirmed:model.matches.filter(m=>m.actual?.confirmed).length};
}
root.PWFieldEngine={POS,LABEL,DEF_WINDOWS,FIRST,DEFAULT_PREFS,players,hardAllowed,makeModel,sanitize,assignment,planOne,planAll,totals};
})(window);
