const TABS=Object.freeze([
  Object.freeze({id:'invullen',label:'Invullen'}),
  Object.freeze({id:'analyse',label:'Analyse'}),
  Object.freeze({id:'acties',label:'Acties'}),
  Object.freeze({id:'bewijs',label:'Bewijs'})
]);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function workspaceModel(contract,{title='',description='',saveStatus='idle',state={}}={}){
 if(!contract?.id)throw new TypeError('WORKSPACE_CONTRACT_REQUIRED');
 return Object.freeze({
  id:contract.id,
  legacyCapability:contract.legacyCapability,
  mode:contract.mode,
  title:String(title||contract.id),
  description:String(description||''),
  saveStatus,
  tabs:TABS,
  dataSlice:contract.dataSlice,
  hasState:Boolean(state&&typeof state==='object')
 });
}

export function saveStatusLabel(status='idle'){
 return ({idle:'Gereed',dirty:'Niet opgeslagen',saving:'Opslaan…',saved:'Opgeslagen',error:'Opslaan mislukt'})[status]||'Gereed';
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
 shell.dataset.activeTab='invullen';
 context.render?.(content,model);
 return Object.freeze({shell,content,model,setSaveStatus(status){model.saveStatus;const badge=shell.querySelector('.v2savestatus');badge.dataset.saveStatus=status;badge.textContent=saveStatusLabel(status);}});
}

export const WORKSPACE_TABS=TABS;
