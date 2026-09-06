import { deriveFlowState, statusLabel } from './flow-state.js';
import { listPortalGroups, buildLegacyUrl } from './page-registry.js';

const SOURCES=[
 ['systemen','◫','Systemen','ERP, CRM, finance, e-mail, HR'],
 ['documenten','▤','Documenten','Contracten, notities, rapporten, beleid'],
 ['processen','⚙','Processen','Werkwijzen, procedures, taken, werkstromen'],
 ['mensen','◎','Mensen','Teams, expertise, kennis, ervaring'],
 ['dashboards','▥','Dashboards',"KPI's, rapportages, voortgang"],
 ['extern','☁','Externe data','Marktdata, concurrentie, wet- en regelgeving'],
 ['modellen','⬡','Modellen',"Rekenmodellen, scenario's, analyses"],
 ['canvassen','▦','Canvassen','Business Model, strategie, business case, plannen']
];
const MODULES=[
 ['inzicht','▥','Inzicht'],['vergelijken','⚖','Vergelijken'],['denken','✦','Denken'],['overname','◎','Overname'],
 ['doen','▶','Doen'],['dna','🧬','Strategy DNA'],['canvas','▦','Execution Canvas'],['roadmap','🗺','Roadmap'],
 ['documenten','▤','Documenten'],['notities','✎','Notities'],['activiteit','⌁','Activiteit'],['wijzigingen','↻','Wijzigingen'],
 ['koppelingen','∞','Koppelingen'],['taken','✓','Taken & werkstromen'],['uren','€','Uren & facturen'],['actueel','⟳','Actueel houden']
];

let selection={source:'documenten',module:'inzicht'};
let previewMode=true;
let runtime=null;

function el(id){return document.getElementById(id)}
function selectedSource(){return SOURCES.find(x=>x[0]===selection.source)}
function selectedModule(){return MODULES.find(x=>x[0]===selection.module)}

function mountSources(){
 const wrap=el('sources');
 SOURCES.forEach(([id,ic,name,sub])=>{
  const b=document.createElement('button');
  b.type='button';b.className='source';b.dataset.id=id;
  b.innerHTML=`<span class="sico">${ic}</span><span><b>${name}</b><small>${sub}</small></span><span class="statebadge">Actief</span>`;
  b.addEventListener('click',()=>{selection.source=selection.source===id?null:id;previewMode=false;render()});
  wrap.appendChild(b);
 });
}
function mountModules(){
 const wrap=el('modules');
 MODULES.forEach(([id,ic,name])=>{
  const b=document.createElement('button');b.type='button';b.className='mod';b.dataset.id=id;
  b.innerHTML=`<span>${ic}</span><b>${name}</b><span class="portalbadge">Actief</span>`;
  b.addEventListener('click',()=>{selection.module=selection.module===id?null:id;previewMode=false;render()});
  wrap.appendChild(b);
 });
}
function mountPreviewControl(){
 const live=document.querySelector('.live');
 if(!live)return;
 const b=document.createElement('button');
 b.type='button';b.className='smallbtn ai';b.id='previewRoute';b.textContent='▶ Toon voorbeeldflow';
 b.setAttribute('aria-label','Toon expliciet een voorbeeld van de gegevensstroom');
 b.addEventListener('click',()=>{
  selection.source=selection.source||'documenten';
  selection.module=selection.module||'inzicht';
  previewMode=true;
  runtime=null;
  render();
 });
 live.appendChild(b);
}

function renderFocus(){
 document.querySelectorAll('.source').forEach(node=>{
  const selected=node.dataset.id===selection.source;
  node.classList.toggle('active',selected);
  node.classList.toggle('inactive',Boolean(selection.source)&&!selected);
 });
 document.querySelectorAll('.mod').forEach(node=>{
  const selected=node.dataset.id===selection.module;
  node.classList.toggle('active',selected);
  node.classList.toggle('inactive',Boolean(selection.module)&&!selected);
 });
}

function renderCopy(flow){
 const source=selectedSource(), module=selectedModule();
 el('flowNowTitle').textContent=source?`Nu geselecteerd: ${source[2]}`:'Geen bron geselecteerd';
 el('flowNow').textContent=source?`${source[3]}. ${flow.sourceFlow?'Voorbeeldroute zichtbaar.':'Selectie alleen; zonder runtime-evidence wordt geen live stroom geclaimd.'}`:'Kies een bron.';
 el('flowBrain').textContent=flow.processingFlow?'Voorbeeld: Datahub, AI Brain en Powerhouse verwerken deze route.':flow.status==='blocked'?'De route is geblokkeerd en stopt vóór verdere verwerking.':'Geen bewezen verwerking actief.';
 el('flowResultTitle').textContent=module?`Bestemming: ${module[2]}`:'Geen portaalmodule geselecteerd';
 el('flowResult').textContent=module?(flow.outputFlow?`Voorbeeldoutput landt in ${module[2]}.`:`${module[2]} is geselecteerd, maar er loopt geen bewezen outputflow.`):'Kies een portaalmodule.';
 const pill=document.querySelector('.livepill');
 if(pill) pill.textContent=`● ${statusLabel(flow.status)}`;
 const previewBtn=el('previewRoute');
 if(previewBtn) previewBtn.textContent=flow.status==='preview'?'● Voorbeeldflow actief':'▶ Toon voorbeeldflow';
 document.querySelectorAll('.cap').forEach(x=>x.classList.toggle('active',flow.processingFlow));
}

function pointWithin(elm,box,side){
 const r=elm.getBoundingClientRect();
 return {x:(side==='right'?r.right:r.left)-box.left,y:r.top-box.top+r.height/2};
}
function appendCurve(svg,a,b,enabled){
 if(!enabled)return;
 const path=document.createElementNS('http://www.w3.org/2000/svg','path');
 path.setAttribute('class','flowpath on');
 const dx=Math.max(38,(b.x-a.x)*.42);
 path.setAttribute('d',`M ${a.x} ${a.y} C ${a.x+dx} ${a.y}, ${b.x-dx} ${b.y}, ${b.x} ${b.y}`);
 svg.appendChild(path);
}
function drawFlow(flow){
 const svg=el('flowSvg'), layout=el('brainLayout'); if(!svg||!layout)return;
 const box=layout.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);svg.innerHTML='';
 if(innerWidth<760)return;
 const source=document.querySelector(`.source[data-id="${selection.source}"]`), module=document.querySelector(`.mod[data-id="${selection.module}"]`), brain=document.querySelector('.layer.ai');
 if(source&&brain)appendCurve(svg,pointWithin(source,box,'right'),pointWithin(brain,box,'left'),flow.sourceFlow);
 if(brain&&module)appendCurve(svg,pointWithin(brain,box,'right'),pointWithin(module,box,'left'),flow.outputFlow);
}
function render(){
 const flow=deriveFlowState({source:selection.source,module:selection.module,runtime,preview:previewMode});
 renderFocus();renderCopy(flow);requestAnimationFrame(()=>drawFlow(flow));
}

function mountPages(){
 const groups=el('groups');
 for(const group of listPortalGroups()){
  const section=document.createElement('section');section.className='group';section.innerHTML=`<h4>${group.label}</h4>`;
  for(const page of group.pages){
   const b=document.createElement('button');b.type='button';b.textContent=page.label;
   b.addEventListener('click',()=>{
    const klant=new URLSearchParams(location.search).get('klant')||'ijsselmonde';
    const url=buildLegacyUrl(page.id,klant); if(url) window.open(url,'_blank','noopener');
   });
   section.appendChild(b);
  }
  groups.appendChild(section);
 }
}

mountSources();mountModules();mountPages();mountPreviewControl();
document.querySelector('.brainimg')?.setAttribute('src','./brain.svg');
el('showPages')?.addEventListener('click',()=>el('allPages').classList.add('open'));
el('mobileMore')?.addEventListener('click',()=>el('allPages').classList.add('open'));
el('closePages')?.addEventListener('click',()=>el('allPages').classList.remove('open'));
el('allPages')?.addEventListener('click',e=>{if(e.target===el('allPages'))el('allPages').classList.remove('open')});
addEventListener('keydown',e=>{if(e.key==='Escape')el('allPages')?.classList.remove('open')});
addEventListener('resize',()=>render());
render();
