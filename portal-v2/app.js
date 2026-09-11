import { deriveFlowState, statusLabel } from './flow-state.js';
import { enhancePortalShell, openPortalPage, closePortalPage, configurePortalShell } from './page-shell.js';
import { mountLegacyParity } from './legacy-parity.js';
import { DESKTOP_NAV_ITEMS, PORTAL_NAV_ITEMS } from './navigation-model.js';
import { bindPortalNavigation, navigatePortal } from './router.js';
import { groupedHubPages, hubDefinition } from './hubs.js';
import { createPortalStateClient, ensureIdentityWidget } from './portal-state.js';
import { createPortalDomainState } from './domain-state.js';
import { mountGlobalActions } from './global-actions-ui.js';
import { applyCustomerBranding } from './customer-branding.js';
import { applyOverviewDashboard } from './modules/overview.js';
import { renderProjectOverview } from './project-overview.js';

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
let activeProjectGroup='project-overview';

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
  b.addEventListener('click',()=>{
   if(id==='dna'){openPortalPage('strategy-dna');return;}
   selection.module=selection.module===id?null:id;previewMode=false;render();
  });
  wrap.appendChild(b);
 });
}
function mountPreviewControl(){
 const live=document.querySelector('.live');if(!live)return;
 const b=document.createElement('button');b.type='button';b.className='smallbtn ai';b.id='previewRoute';b.textContent='▶ Toon voorbeeldflow';
 b.setAttribute('aria-label','Toon expliciet een voorbeeld van de gegevensstroom');
 b.addEventListener('click',()=>{selection.source=selection.source||'documenten';selection.module=selection.module||'inzicht';previewMode=true;runtime=null;render()});
 live.appendChild(b);
}
function renderFocus(){
 document.querySelectorAll('.source').forEach(node=>{const selected=node.dataset.id===selection.source;node.classList.toggle('active',selected);node.classList.toggle('inactive',Boolean(selection.source)&&!selected)});
 document.querySelectorAll('.mod').forEach(node=>{const selected=node.dataset.id===selection.module;node.classList.toggle('active',selected);node.classList.toggle('inactive',Boolean(selection.module)&&!selected)});
}
function renderCopy(flow){
 const source=selectedSource(),module=selectedModule();
 el('flowNowTitle').textContent=source?`Nu geselecteerd: ${source[2]}`:'Geen bron geselecteerd';
 el('flowNow').textContent=source?`${source[3]}. ${flow.sourceFlow?'Voorbeeldroute zichtbaar.':'Selectie alleen; zonder runtime-evidence wordt geen live stroom geclaimd.'}`:'Kies een bron.';
 el('flowBrain').textContent=flow.processingFlow?'Voorbeeld: Datahub, AI Brain en Powerhouse verwerken deze route.':flow.status==='blocked'?'De route is geblokkeerd en stopt vóór verdere verwerking.':'Geen bewezen verwerking actief.';
 el('flowResultTitle').textContent=module?`Bestemming: ${module[2]}`:'Geen portaalmodule geselecteerd';
 el('flowResult').textContent=module?(flow.outputFlow?`Voorbeeldoutput landt in ${module[2]}.`:`${module[2]} is geselecteerd, maar er loopt geen bewezen outputflow.`):'Kies een portaalmodule.';
 const pill=document.querySelector('.livepill');if(pill)pill.textContent=`● ${statusLabel(flow.status)}`;
 const previewBtn=el('previewRoute');if(previewBtn)previewBtn.textContent=flow.status==='preview'?'● Voorbeeldflow actief':'▶ Toon voorbeeldflow';
 document.querySelectorAll('.cap').forEach(x=>x.classList.toggle('active',flow.processingFlow));
}
function pointWithin(elm,box,side){const r=elm.getBoundingClientRect();return{x:(side==='right'?r.right:r.left)-box.left,y:r.top-box.top+r.height/2}}
function appendCurve(svg,a,b,enabled){if(!enabled)return;const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('class','flowpath on');const dx=Math.max(38,(b.x-a.x)*.42);path.setAttribute('d',`M ${a.x} ${a.y} C ${a.x+dx} ${a.y}, ${b.x-dx} ${b.y}, ${b.x} ${b.y}`);svg.appendChild(path)}
function drawFlow(flow){
 const svg=el('flowSvg'),layout=el('brainLayout');if(!svg||!layout)return;
 const box=layout.getBoundingClientRect();svg.setAttribute('viewBox',`0 0 ${box.width} ${box.height}`);svg.innerHTML='';if(innerWidth<760)return;
 const source=document.querySelector(`.source[data-id="${selection.source}"]`),module=document.querySelector(`.mod[data-id="${selection.module}"]`),brain=document.querySelector('.layer.ai');
 if(source&&brain)appendCurve(svg,pointWithin(source,box,'right'),pointWithin(brain,box,'left'),flow.sourceFlow);
 if(brain&&module)appendCurve(svg,pointWithin(brain,box,'right'),pointWithin(module,box,'left'),flow.outputFlow);
}
function render(){const flow=deriveFlowState({source:selection.source,module:selection.module,runtime,preview:previewMode});renderFocus();renderCopy(flow);requestAnimationFrame(()=>drawFlow(flow))}

function openProjectPage(pageId){closeHub();navigatePortal(pageId);}
function renderProjectContext(groups){
 const wrap=document.createElement('div');wrap.className='projectcontext';
 const tabs=document.createElement('div');tabs.className='projecttabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Jouw project');
 const content=document.createElement('div');content.className='projectgroupcontent';
 const renderGroup=group=>{
   activeProjectGroup=group.id;
   [...tabs.children].forEach(button=>{const selected=button.dataset.projectGroup===group.id;button.setAttribute('aria-selected',String(selected));button.classList.toggle('active',selected)});
   content.innerHTML='';
   if(group.id==='project-overview'){
     let state={};try{state=portalDomainState?.get?.()||{};}catch{}
     renderProjectOverview(content,state,{openPage:openProjectPage});
     return;
   }
   const section=document.createElement('section');section.className='group projectgroup';section.innerHTML=`<h4>${group.label}</h4>`;
   for(const page of group.pages){
     const b=document.createElement('button');b.type='button';b.textContent=page.label;b.dataset.page=page.target||page.id;
     b.addEventListener('click',()=>openProjectPage(page.target||page.id));
     section.appendChild(b);
   }
   content.appendChild(section);
 };
 for(const group of groups){
   const tab=document.createElement('button');tab.type='button';tab.dataset.projectGroup=group.id;tab.setAttribute('role','tab');tab.textContent=group.label;
   tab.addEventListener('click',()=>renderGroup(group));tabs.appendChild(tab);
 }
 wrap.append(tabs,content);
 const selected=groups.find(group=>group.id===activeProjectGroup)||groups[0];if(selected)renderGroup(selected);
 return wrap;
}
function renderHubGroups(hubId='portal'){
 const groups=el('groups');if(!groups)return;
 groups.innerHTML='';
 const data=groupedHubPages(hubId);
 if(hubId==='project'){groups.appendChild(renderProjectContext(data));return;}
 for(const group of data){
  const section=document.createElement('section');section.className='group';section.innerHTML=`<h4>${group.label}</h4>`;
  for(const page of group.pages){
   const target=page.target||page.id;
   const b=document.createElement('button');b.type='button';b.textContent=page.label;b.dataset.page=target;
   b.addEventListener('click',()=>{closeHub();navigatePortal(target)});
   section.appendChild(b);
  }
  groups.appendChild(section);
 }
}
function mountDesktopProjectNavigation(){
 const nav=document.querySelector('.sidebar .nav');if(!nav||document.querySelector('.desktop-project-nav'))return;
 const section=document.createElement('section');section.className='desktop-project-nav';
 section.innerHTML='<div class="desktop-project-title">Jouw project</div>';
 for(const group of groupedHubPages('project')){
   const block=document.createElement('div');block.className='desktop-project-group';
   const heading=document.createElement('button');heading.type='button';heading.className='desktop-project-heading';heading.textContent=group.label;
   heading.addEventListener('click',()=>{activeProjectGroup=group.id;navigatePortal('hub:project')});block.appendChild(heading);
   if(group.id!=='project-overview')for(const page of group.pages){const link=document.createElement('button');link.type='button';link.className='desktop-project-link';link.textContent=page.label;link.addEventListener('click',()=>navigatePortal(page.target||page.id));block.appendChild(link)}
   section.appendChild(block);
 }
 nav.after(section);
}
function markNavigationControls(){
 const desktop=[...document.querySelectorAll('.nav button')];
 DESKTOP_NAV_ITEMS.forEach((item,index)=>{if(desktop[index])desktop[index].dataset.navTarget=item.target});
 const mobile=[...document.querySelectorAll('.mobilebar button')];
 const icons={overview:'⌂',project:'▣','data-ai':'✦',tasks:'✓',more:'☰'};
 PORTAL_NAV_ITEMS.forEach((item,index)=>{if(mobile[index]){mobile[index].dataset.mobileNav=item.id;mobile[index].innerHTML=`${icons[item.id]||'•'}<br>${item.label}`;}});
}
function openHub(hubId){
 const sheet=el('allPages');if(!sheet)return;
 const definition=hubDefinition(hubId) || hubDefinition('portal');
 renderHubGroups(hubId);
 const heading=sheet.querySelector('.sheethead h3');if(heading)heading.textContent=definition.label;
 const description=sheet.querySelector('.sheethead small');if(description)description.textContent=definition.description;
 sheet.dataset.hub=hubId;
 sheet.classList.add('open');
 sheet.setAttribute('aria-hidden','false');
}
function closeHub(){
 const sheet=el('allPages');if(!sheet)return;
 sheet.classList.remove('open');
 sheet.removeAttribute('data-hub');
 sheet.setAttribute('aria-hidden','true');
}
function ensureNavigationStyles(){
 if([...document.querySelectorAll('link[rel="stylesheet"]')].some(link=>link.getAttribute('href')==='./navigation.css'))return;
 const style=document.createElement('link');style.rel='stylesheet';style.href='./navigation.css';document.head.appendChild(style);
}

const portalStateClient=createPortalStateClient();
const portalDomainState=createPortalDomainState(portalStateClient);
configurePortalShell({domainState:portalDomainState});
portalStateClient.subscribe(snap=>applyCustomerBranding({state:snap.state||{},user:snap.user}));
portalDomainState.subscribe(snap=>{applyOverviewDashboard(document,snap.state||{});if(el('allPages')?.dataset.hub==='project')renderHubGroups('project')});
mountSources();mountModules();renderHubGroups('portal');mountPreviewControl();markNavigationControls();mountDesktopProjectNavigation();ensureNavigationStyles();enhancePortalShell();mountLegacyParity({openPage:openPortalPage});mountGlobalActions({stateClient:portalStateClient});
bindPortalNavigation({
 openPage:openPortalPage,
 openHub,
 closeHub,
 showOverview:()=>{closePortalPage();closeHub()}
});
document.querySelector('.brainimg')?.setAttribute('src','./brain.svg');
el('showPages')?.addEventListener('click',()=>navigatePortal('hub:portal'));
el('closePages')?.addEventListener('click',()=>{closeHub();navigatePortal('overzicht',{replace:true})});
el('allPages')?.addEventListener('click',e=>{if(e.target===el('allPages')){closeHub();navigatePortal('overzicht',{replace:true})}});
addEventListener('keydown',e=>{if(e.key==='Escape'&&el('allPages')?.classList.contains('open')){closeHub();navigatePortal('overzicht',{replace:true})}});
addEventListener('resize',render);render();
ensureIdentityWidget().then(identity=>{
 const refreshDomainState=()=>portalDomainState.init().catch(()=>null);
 identity?.on?.('login',refreshDomainState);
 identity?.on?.('logout',refreshDomainState);
 refreshDomainState();
});
