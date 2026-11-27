import {listPortalGroups} from './page-registry.js';
import {isProtectedTrustPage,hasProtectedTrustAccess} from './page-shell.js';
import {navigatePortal,subscribePortalRoute} from './router.js';

// Canonical page-index search ONLY. This never searches private business data,
// bypasses entitlement/tenant gates, invents results, or creates a new router.
const clean=value=>String(value??'').trim().toLocaleLowerCase('nl-NL');
const entries=Object.freeze(listPortalGroups().flatMap(group=>group.pages.map(page=>Object.freeze({
 id:page.id,target:page.id,label:page.label,group:group.label
}))));

export function filterPortalQuickSwitchEntries(query='',{allowTarget=()=>true,limit=7}={}){
 const term=clean(query);
 return Object.freeze(entries
  .filter(item=>allowTarget(item.target))
  .filter(item=>!term||clean(item.label+' '+item.group+' '+item.id).includes(term))
  .sort((a,b)=>{
   const score=item=>!term?0:clean(item.label)===term?3:clean(item.label).startsWith(term)?2:clean(item.id).startsWith(term)?1:0;
   return score(b)-score(a);
  })
  .slice(0,Math.max(0,Math.min(10,limit))));
}

export function mountPortalQuickSwitcher({documentRef=globalThis.document,stateClient,navigate=navigatePortal}={}){
 const input=documentRef?.querySelector?.('.topbar .searchrow input.search');
 if(!input||!stateClient?.getSnapshot)return null;
 if(input.dataset.portalQuickSwitcher==='v1')return null;
 const wrap=input.closest('.searchrow');
 if(!wrap)return null;
 input.dataset.portalQuickSwitcher='v1';
 input.type='search';
 input.placeholder='Zoek een onderdeel…';
 input.setAttribute('aria-label','Zoek en open een onderdeel van het portaal');
 input.setAttribute('role','combobox');
 input.setAttribute('aria-autocomplete','list');
 input.setAttribute('aria-expanded','false');
 input.setAttribute('aria-keyshortcuts','Control+K Meta+K');
 input.spellcheck=false;
 input.setAttribute('aria-controls','portalQuickSwitchResults');
 input.autocomplete='off';
 const list=documentRef.createElement('div');
 list.id='portalQuickSwitchResults';
 list.className='portal-quick-switch-results';
 list.setAttribute('role','listbox');
 list.setAttribute('aria-label','Portaalonderdelen');
 list.hidden=true;
 wrap.appendChild(list);
 let found=[],active=0;
 const authenticated=()=>{
  const snapshot=stateClient.getSnapshot();
  return Boolean(snapshot?.user?.id&&['authenticated','empty'].includes(snapshot.mode)&&!stateClient.isDemo?.());
 };
 const allowed=target=>!isProtectedTrustPage(target)||hasProtectedTrustAccess();
 const close=()=>{
  list.hidden=true;input.setAttribute('aria-expanded','false');
  input.removeAttribute('aria-activedescendant');found=[];active=0;
 };
 const paintActive=()=>{
  for(const [index,button] of [...list.querySelectorAll('[role="option"]')].entries())
   button.setAttribute('aria-selected',String(index===active));
  if(found[active])input.setAttribute('aria-activedescendant','portalQuickSwitchOption'+active);
  else input.removeAttribute('aria-activedescendant');
 };
 const open=()=>{
  if(!authenticated()){close();return;}
  found=filterPortalQuickSwitchEntries(input.value,{allowTarget:allowed,limit:7});
  active=0;list.replaceChildren();
  if(!found.length){
   const empty=documentRef.createElement('p');
   empty.className='portal-quick-switch-empty';
   empty.textContent='Geen onderdeel gevonden. Probeer een andere term.';
   list.appendChild(empty);
  }
  for(const [index,item] of found.entries()){
   const button=documentRef.createElement('button');
   button.type='button';button.id='portalQuickSwitchOption'+index;
   button.setAttribute('role','option');button.setAttribute('aria-selected',String(index===active));
   button.className='portal-quick-switch-option';
   button.dataset.portalSwitchTarget=item.target;
   const label=documentRef.createElement('strong');label.textContent=item.label;
   const group=documentRef.createElement('span');group.textContent=item.group;
   button.append(label,group);list.appendChild(button);
  }
  list.hidden=false;input.setAttribute('aria-expanded','true');paintActive();
 };
 const activate=index=>{
  if(!authenticated())return close();
  const entry=found[index];
  if(!entry||!allowed(entry.target))return close();
  close();input.value='';
  navigate(entry.target);
 };
 input.addEventListener('focus',open);
 input.addEventListener('input',open);
 input.addEventListener('keydown',event=>{
  if(event.key==='Escape'){if(!list.hidden){event.preventDefault();close();}return;}
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   if(list.hidden)open();
   if(!found.length)return;
   event.preventDefault();
   active=(active+(event.key==='ArrowDown'?1:-1)+found.length)%found.length;
   paintActive();return;
  }
  if(event.key==='Enter'&&!list.hidden&&found.length){
   event.preventDefault();activate(active);
  }
 });
 list.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-portal-switch-target]');
  if(!button||!list.contains(button))return;
  const index=found.findIndex(item=>item.target===button.dataset.portalSwitchTarget);
  activate(index);
 });
 const outside=event=>{
  if(!wrap.contains(event.target))close();
 };
 documentRef.addEventListener('pointerdown',outside);
 const keyboard=event=>{
  if(!authenticated()||event.altKey)return;
  const isInput=event.target?.matches?.('input,textarea,select,[contenteditable="true"]');
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
   event.preventDefault();input.focus();open();
  }else if(!isInput&&!event.ctrlKey&&!event.metaKey&&event.key==='/'){
   event.preventDefault();input.focus();open();
  }
 };
 documentRef.addEventListener('keydown',keyboard);
 const identity=()=>{close();input.value='';};
 documentRef.addEventListener('bg:portal-identity-boundary',identity);
 const unsubscribe=subscribePortalRoute(close);
 return Object.freeze({element:list,destroy(){
  close();unsubscribe?.();
  documentRef.removeEventListener('pointerdown',outside);
  documentRef.removeEventListener('keydown',keyboard);
  documentRef.removeEventListener('bg:portal-identity-boundary',identity);
  input.removeAttribute('data-portal-quick-switcher');
  list.remove();
 }});
}
