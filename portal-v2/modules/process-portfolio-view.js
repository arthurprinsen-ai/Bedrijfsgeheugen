import {PROCESS_TEMPLATES,processPortfolioOverview,instantiateProcess,recordProcessStepIntent} from './process-portfolio.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LABELS=Object.freeze({
 submitted_not_verified:'Door gebruiker gemarkeerd · ontvangstbewijs open',
 awaiting_authorized_approval:'Wacht op bevoegde goedkeuring',
 waiting_dependency:'Wacht op voorgaande stap',
 missing_owner:'Eigenaar ontbreekt',
 ready_for_customer_input:'Kan worden opgepakt'
});
export function processPortfolioMarkup(state,{today=new Date().toISOString().slice(0,10),handoffEvidence=null}={}){
 const portfolio=processPortfolioOverview(state,{today});
 const opts=PROCESS_TEMPLATES.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.label)+'</option>').join('');
 const cards=portfolio.items.map(p=>{
  const steps=p.steps.map((s,i)=>{
   const status=p.stages[i];
   const button=status.eligible?
    '<button type="button" data-process-id="'+esc(p.id)+'" data-process-step="'+esc(s.id)+'">'+
     (s.kind==='approval'?'Goedkeuring aanvragen':'Uitvoering vastleggen')+'</button>':'';
   return '<li class="v2processstep" data-process-status="'+esc(status.status)+'"><div>'+
    '<strong>'+esc(s.label)+'</strong><small>'+(s.kind==='approval'?'Besluit':'Taak')+
    ' · '+esc(s.owner||p.owner||'Geen eigenaar')+(s.dueDate?' · '+esc(s.dueDate):'')+
    '</small><span>'+esc(LABELS[status.status]||'Nog te beoordelen')+
    (status.overdue?' · termijn verstreken':'')+'</span></div>'+button+'</li>';
  }).join('');
  return '<article class="v2processcard"><header><div><strong>'+esc(p.title)+'</strong>'+
   '<small>'+esc(p.owner||'Eigenaar ontbreekt')+' · '+esc(p.targetDate||'Geen einddatum')+
   '</small></div><span>'+p.completeByCustomer+'/'+p.steps.length+' invoerstappen</span></header>'+
   '<ol>'+steps+'</ol><p>Invoer is nog geen onafhankelijke ONE BRAIN-ontvangst, Powerhouse-uitvoering of Heartbeat-effect.</p></article>';
 }).join('');
 return '<section class="v2processportfolio" data-process-portfolio><details><summary>'+
  '<strong>Processen & overdrachten</strong><span>'+portfolio.open+' processen · '+
  portfolio.pendingApprovals+' goedkeuringen open · '+portfolio.overdue+' termijnen verstreken</span>'+
  '</summary><div class="v2processbody"><p>Gebruik één bestaand bedrijfsplan met eigenaren, afhankelijkheden en deadlines. '+
  'Goedkeuring vraagt altijd een bevoegde, onafhankelijk bevestigde handeling.</p>'+
  (portfolio.open?'<p class="v2processhandoff" data-process-handoff="'+esc(handoffEvidence?.status||'EVIDENCE_DUE')+'" role="status">'+
  (handoffEvidence?.status==='BRAIN_INPUT_ACK'?'ONE BRAIN heeft deze procesinvoer ontvangen · bronrevisie '+esc(handoffEvidence.sourceRevision)+' · ontvangst '+esc(handoffEvidence.brainRecordId)+'. Uitvoering, resultaat en leren blijven apart te bewijzen.':
  'ONE BRAIN-ontvangst voor de actuele invoer is nog niet in deze sessie bevestigd. Nieuwe wijzigingen vragen een nieuw ontvangstbewijs.')+'</p>':'')+
  '<form data-process-create><label>Procesvorm<select name="templateId" required>'+opts+'</select></label>'+
  '<label>Procesnaam<input name="title" maxlength="120" required placeholder="Bijvoorbeeld nieuwe productlijn"></label>'+
  '<label>Verantwoordelijke<input name="owner" maxlength="120" required placeholder="Naam of team"></label>'+
  '<label>Gewenste einddatum<input name="targetDate" type="date"></label>'+
  '<button type="submit">Proces starten</button></form><p data-process-error role="status"></p>'+
  (cards||'<p class="v2processempty">Nog geen proces. Kies een procesvorm om te beginnen.</p>')+
  '</div></details></section>';
}
export function bindProcessPortfolio(panel,{getState,onChange}={}){
 if(!panel||typeof getState!=='function'||typeof onChange!=='function')
  throw new TypeError('PROCESS_PORTFOLIO_BINDING_REQUIRED');
 const errorMessage=e=>{const n=panel.querySelector('[data-process-error]');if(n)n.textContent=String(e?.message||e||'Opslaan niet mogelijk');};
 const id=prefix=>{
  if(typeof globalThis.crypto?.randomUUID!=='function')throw new Error('SECURE_PROCESS_ID_UNAVAILABLE');
  return prefix+globalThis.crypto.randomUUID();
 };
 panel.querySelector('[data-process-create]')?.addEventListener('submit',event=>{
  event.preventDefault();
  try{
   const data=new FormData(event.currentTarget);
   onChange(instantiateProcess(getState(),{
    id:id('p-'),templateId:String(data.get('templateId')||''),
    title:String(data.get('title')||''),owner:String(data.get('owner')||''),
    targetDate:String(data.get('targetDate')||'')
   }));
  }catch(error){errorMessage(error);}
 });
 panel.querySelectorAll('[data-process-step]').forEach(button=>button.addEventListener('click',()=>{
  try{
   const state=getState(),p=state.processes?.find(x=>x.id===button.dataset.processId);
   const step=p?.steps?.find(x=>x.id===button.dataset.processStep);
   onChange(recordProcessStepIntent(state,{
    processId:button.dataset.processId,stepId:button.dataset.processStep,
    action:step?.kind==='approval'?'request':'submit',
    intentId:id('i-'),observedAt:new Date().toISOString()
   }));
  }catch(error){errorMessage(error);}
 }));
}
