const get=(obj,path)=>path.split('.').reduce((value,key)=>value&&typeof value==='object'?value[key]:undefined,obj);
const first=(state,paths)=>{
  for(const path of paths){const value=get(state,path);if(value!==undefined&&value!==null&&value!=='')return value;}
  return null;
};
const count=(value)=>Array.isArray(value)?value.length:Number.isFinite(Number(value))?Number(value):null;
const formatMoney=value=>Number.isFinite(Number(value))?new Intl.NumberFormat('nl-NL',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(value)):null;

export function projectOverviewModel(state={}){
  const activity=first(state,['portal.activity','activity','portal.project.activity']);
  return Object.freeze({
    phase:first(state,['portal.project.phase','project.phase','portal.project.status','project.status']),
    offerStatus:first(state,['portal.offer.status','offer.status','portal.offerte.status','offerte.status']),
    hours:first(state,['portal.project.hours','project.hours','portal.financial.hours','financial.hours']),
    budget:first(state,['portal.project.budget','project.budget','portal.financial.budget','financial.budget']),
    buildItems:count(first(state,['portal.project.buildItems','project.buildItems','portal.delivery.buildItems','delivery.buildItems'])),
    integrations:count(first(state,['portal.integrations.items','integrations.items','portal.connections','connections'])),
    openTasks:first(state,['portal.delivery.openTasks','delivery.openTasks','portal.tasks.open','tasks.open']),
    documents:first(state,['portal.documents.count','documents.count']) ?? count(first(state,['portal.documents.items','documents.items'])),
    notes:first(state,['portal.notes.count','notes.count']) ?? count(first(state,['portal.notes.items','notes.items'])),
    team:first(state,['portal.access.members','access.members','portal.team.members','team.members']) ?? count(first(state,['portal.access.users','access.users','portal.team.users','team.users'])),
    nextAction:first(state,['portal.project.nextAction','project.nextAction','portal.delivery.nextAction','delivery.nextAction']),
    activity:Array.isArray(activity)?activity.slice(0,5):[]
  });
}

function esc(value=''){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
function valueOrUnknown(value,{money=false,suffix=''}={}){
  if(value===null||value===undefined||value==='')return '<span class="projectunknown">Nog geen status</span>';
  const shown=money?formatMoney(value):`${value}${suffix}`;
  return `<strong>${esc(shown)}</strong>`;
}

export function renderProjectOverview(root,state={},context={}){
  if(!root?.replaceChildren)return null;
  const model=projectOverviewModel(state);
  const wrap=document.createElement('section');
  wrap.className='projectcockpit';
  wrap.innerHTML=`
    <div class="projectcockpit-head"><div><span>Jouw project</span><h3>Van offerte tot oplevering</h3><p>Alles wat je verkoopt, bouwt, koppelt, uitvoert en overdraagt in één werklaag.</p></div>${model.nextAction?`<button type="button" data-project-page="taken-werkstromen">Volgende actie: ${esc(model.nextAction)}</button>`:''}</div>
    <div class="projectcockpit-grid">
      <article><small>Projectfase</small>${valueOrUnknown(model.phase)}</article>
      <article><small>Offerte</small>${valueOrUnknown(model.offerStatus)}</article>
      <article><small>Budget</small>${valueOrUnknown(model.budget,{money:true})}</article>
      <article><small>Bestede uren</small>${valueOrUnknown(model.hours,{suffix:' uur'})}</article>
      <article><small>Actieve bouwitems</small>${valueOrUnknown(model.buildItems)}</article>
      <article><small>Koppelingen / integraties</small>${valueOrUnknown(model.integrations)}</article>
      <article><small>Open taken</small>${valueOrUnknown(model.openTasks)}</article>
      <article><small>Team & toegang</small>${valueOrUnknown(model.team)}</article>
      <article><small>Documenten</small>${valueOrUnknown(model.documents)}</article>
      <article><small>Notities</small>${valueOrUnknown(model.notes)}</article>
    </div>
    <div class="projectcockpit-actions">
      <button type="button" data-project-page="offerte">Offerte</button>
      <button type="button" data-project-page="koppelingen">Bouwen & koppelen</button>
      <button type="button" data-project-page="taken-werkstromen">Taken</button>
      <button type="button" data-project-page="documenten">Documenten</button>
      <button type="button" data-project-page="gebruikers">Team & toegang</button>
    </div>
    ${model.activity.length?`<div class="projectactivity"><strong>Recente activiteit</strong>${model.activity.map(item=>`<div>${esc(item?.label??item?.title??item)}</div>`).join('')}</div>`:''}
  `;
  wrap.querySelectorAll('[data-project-page]').forEach(button=>button.addEventListener('click',()=>context.openPage?.(button.dataset.projectPage)));
  root.replaceChildren(wrap);
  return model;
}
