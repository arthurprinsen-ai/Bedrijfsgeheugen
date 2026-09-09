const TABS=Object.freeze([
  Object.freeze({id:'invullen',label:'Invullen'}),
  Object.freeze({id:'analyse',label:'Analyse'}),
  Object.freeze({id:'acties',label:'Acties'}),
  Object.freeze({id:'bewijs',label:'Bewijs'})
]);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function workspaceModel(contract,{title='',description='',saveStatus='idle',state={}}={}){
 if(!contract?.id)throw new TypeError('WORKSPACE_CONTRACT_REQUIRED');
 return Object.freeze({id:contract.id,legacyCapability:contract.legacyCapability,mode:contract.mode,title:String(title||contract.id),description:String(description||''),saveStatus,tabs:TABS,dataSlice:contract.dataSlice,hasState:Boolean(state&&typeof state==='object')});
}

export function saveStatusLabel(status='idle'){
 return ({idle:'Gereed',dirty:'Niet opgeslagen',saving:'Opslaan…',saved:'Opgeslagen',error:'Opslaan mislukt'})[status]||'Gereed';
}

function navigateWithinV2(pageId){
 if(typeof location==='undefined')return;
 const url=new URL(location.href);url.searchParams.delete('hub');url.searchParams.set('page',pageId);location.assign(url.toString());
}
function loadFunctionalStyles(){
 if(typeof document==='undefined')return Promise.resolve();
 const existing=[...document.querySelectorAll('link[rel="stylesheet"]')].find(link=>link.getAttribute('href')==='./functional-suite.css'||link.href.endsWith('/portal-v2/functional-suite.css'));
 if(existing){if(existing.sheet)return Promise.resolve();return new Promise(resolve=>{existing.addEventListener('load',resolve,{once:true});existing.addEventListener('error',resolve,{once:true});});}
 return new Promise(resolve=>{const link=document.createElement('link');link.rel='stylesheet';link.href='./functional-suite.css';link.addEventListener('load',resolve,{once:true});link.addEventListener('error',resolve,{once:true});document.head.appendChild(link);});
}

export function mountWorkspace(root,contract,context={}){
 if(!root?.replaceChildren)throw new TypeError('WORKSPACE_ROOT_REQUIRED');
 const model=workspaceModel(contract,context);
 const shell=document.createElement('div');shell.className=`v2workspace v2workspace-${model.mode}`;shell.dataset.workspace=model.id;
 shell.innerHTML=`<div class="v2workspacebar"><div><span class="v2workspaceeyebrow">Werkruimte</span><strong>${escapeHtml(model.title)}</strong></div><span class="v2savestatus" data-save-status="${escapeHtml(model.saveStatus)}">${escapeHtml(saveStatusLabel(model.saveStatus))}</span></div><p class="v2workspacedescription">${escapeHtml(model.description)}</p><div class="v2workspacetabs" role="tablist">${model.tabs.map((tab,index)=>`<button type="button" role="tab" data-workspace-tab="${tab.id}" aria-selected="${index===0?'true':'false'}">${tab.label}</button>`).join('')}</div><div class="v2workspacecontent" data-workspace-content></div>`;
 root.replaceChildren(shell);
 const content=shell.querySelector('[data-workspace-content]');
 shell.querySelectorAll('[data-workspace-tab]').forEach(button=>button.addEventListener('click',()=>{
  shell.querySelectorAll('[data-workspace-tab]').forEach(tab=>tab.setAttribute('aria-selected',String(tab===button)));
  shell.dataset.activeTab=button.dataset.workspaceTab;
  context.onTabChange?.(button.dataset.workspaceTab,content,model);
 }));
 shell.dataset.activeTab='invullen';context.render?.(content,model);
 const api=Object.freeze({shell,content,model,setSaveStatus(status){const badge=shell.querySelector('.v2savestatus');if(badge){badge.dataset.saveStatus=status;badge.textContent=saveStatusLabel(status);}}});
 if(contract?.legacyCapability&&!root.dataset.functionalDelegating){
  const modulePath=contract.id==='roadmap'?'./modules/roadmap-workspace.js':'./modules/functional-suite.js';
  Promise.all([loadFunctionalStyles(),import(modulePath)]).then(([,module])=>{
   root.dataset.functionalDelegating='1';
   try{
    if(contract.id==='roadmap')module.mountRoadmapWorkspace?.(root,{contract,view:{title:model.title,description:model.description},domainState:globalThis.__BG_PORTAL_DOMAIN_STATE__||null,openPage:navigateWithinV2});
    else if(module.functionalDefinition?.(contract.id))module.mountFunctionalWorkspace(root,{pageId:contract.id,contract,view:{title:model.title,description:model.description},domainState:globalThis.__BG_PORTAL_DOMAIN_STATE__||null,openPage:navigateWithinV2});
   } finally{delete root.dataset.functionalDelegating;}
  }).catch(error=>{console.error('FUNCTIONAL_WORKSPACE_LOAD_FAILED',error);});
 }
 return api;
}

export const WORKSPACE_TABS=TABS;