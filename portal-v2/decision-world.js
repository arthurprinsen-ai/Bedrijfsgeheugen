/**
 * The Living Company: read-only, evidence-first journey visualization.
 * No extra tenant store, decision authority, scheduler or provider request.
 */
const STAGES=Object.freeze([
 {id:'scan',label:'Startpunt',yes:'Nulmeting gekoppeld',no:'Nulmeting open'},
 {id:'goal',label:'Richting',yes:'Doel vastgelegd',no:'Doel open'},
 {id:'evidence',label:'Inzicht',yes:'Bronbewijs aanwezig',no:'Bronbewijs open'},
 {id:'decision',label:'Besluit',yes:'Voorstel onderbouwd',no:'Voorstel nog open'},
 {id:'outcome',label:'Effect',yes:'Effect geverifieerd',no:'Effect niet aangetoond'}
]);
export function buildDecisionWorldNodes(home={},journey={}){
 if(home?.authenticated!==true||journey?.authenticated!==true)return Object.freeze([]);
 const steps=new Map((Array.isArray(journey.steps)?journey.steps:[])
   .filter(step=>step&&STAGES.some(item=>item.id===step.id))
   .map(step=>[step.id,step]));
 return Object.freeze(STAGES.map(stage=>{
  const step=steps.get(stage.id),confirmed=step?.confirmed===true;
  return Object.freeze({
   id:stage.id,label:stage.label,confirmed,
   status:confirmed?stage.yes:stage.no,
   detail:typeof step?.detail==='string'&&step.detail.trim()?step.detail.trim().slice(0,500):
     'Voor deze stap is nog geen gecontroleerde klantgebonden informatie beschikbaar.'
  });
 }));
}
function add(parent,tag,className,copy){
 const node=parent.ownerDocument.createElement(tag);
 if(className)node.className=className;
 if(copy!==undefined)node.textContent=String(copy);
 parent.appendChild(node);return node;
}
/** The single primary next-action remains owned by entrepreneur-home.js. */
export function renderDecisionWorld(parent,{home,journey,selectedStage='decision',onSelect=()=>{}}={}){
 const nodes=buildDecisionWorldNodes(home,journey);
 if(!parent?.ownerDocument||nodes.length!==STAGES.length)return null;
 const world=add(parent,'section','bdw-world');
 world.dataset.livingDecisionWorld='v1';
 world.setAttribute('aria-labelledby','bdw-title');
 const heading=add(world,'div','bdw-heading');
 add(heading,'span','bdw-eyebrow','DE LEVENDE KAART VAN JOUW BEDRIJF');
 add(heading,'h4','', 'Zie waar jouw volgende verbetering begint.').id='bdw-title';
 add(heading,'p','','Raak een schakel aan. Ontdek wat is onderbouwd en wat nog ontbreekt. Geen voorspeld of gerealiseerd financieel resultaat.');
 const composition=add(world,'div','bdw-composition');
 const orbit=add(composition,'div','bdw-orbit');
 orbit.setAttribute('role','group');
 orbit.setAttribute('aria-label','Verken vijf bewijsstappen van jouw onderneming');
 const center=add(orbit,'div','bdw-core');
 add(center,'span','bdw-core-label','JOUW RICHTING');
 add(center,'strong','',home?.selectedGoal?String(home.headline||'Jouw doel').slice(0,110):'Jouw ambitie');
 add(center,'small','',home?.selectedGoal?'Bepaalt je volgende stap':'Kies eerst je ondernemersdoel');
 const readout=add(composition,'div','bdw-readout');
 readout.setAttribute('aria-live','polite');
 readout.setAttribute('aria-atomic','true');
 const ordinal=add(readout,'span','bdw-readout-label');
 const status=add(readout,'strong','bdw-readout-status');
 const detail=add(readout,'p','bdw-readout-copy');
 add(readout,'p','bdw-readout-trust','Een bevestigd voorstel is nog geen uitgevoerde actie. Alleen onafhankelijke uitkomstbewijzen tellen als effect.');
 const buttons=new Map();
 function show(id){
  const item=nodes.find(node=>node.id===id);if(!item)return;
  onSelect(id);
  buttons.forEach((button,key)=>{
   const active=key===id;
   button.setAttribute('aria-pressed',String(active));
   button.classList.toggle('is-selected',active);
  });
  ordinal.textContent=(nodes.indexOf(item)+1)+' VAN '+nodes.length+' · '+item.label.toUpperCase();
  status.textContent=item.status;status.dataset.confirmed=String(item.confirmed);
  detail.textContent=item.detail;
 }
 nodes.forEach((node,index)=>{
  const button=add(orbit,'button','bdw-node');
  button.type='button';button.dataset.bdwStage=node.id;
  button.dataset.confirmed=String(node.confirmed);
  button.setAttribute('aria-pressed','false');
  button.setAttribute('aria-label',(index+1)+' van '+nodes.length+': '+node.label+'. '+node.status);
  add(button,'span','bdw-node-number',String(index+1).padStart(2,'0'));
  add(button,'span','bdw-node-name',node.label);
  add(button,'span','bdw-node-dot').setAttribute('aria-hidden','true');
  button.addEventListener('click',()=>show(node.id));
  button.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();
   const next=event.key==='Home'?0:event.key==='End'?nodes.length-1:
     (index+(event.key==='ArrowRight'?1:-1)+nodes.length)%nodes.length;
   buttons.get(nodes[next].id)?.focus();show(nodes[next].id);
  });
  buttons.set(node.id,button);
 });
 show(nodes.some(node=>node.id===selectedStage)?selectedStage:'decision');
 return world;
}
