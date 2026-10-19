// Read-only, fail-closed Decision Twin evidence chain over existing tenant portal state.
// A numerical what-if is never an authorized intervention or a measured causal effect.
const list=x=>Array.isArray(x)?x:[];
const txt=x=>typeof x==='string'?x.trim():'';
const exact=(x,y)=>Boolean(x&&y&&x===y);
const refs=x=>[...new Set(list(x).map(txt).filter(Boolean))].slice(0,30);
const iso=x=>Boolean(txt(x)&&Number.isFinite(Date.parse(x)));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function scopeFor(state){
 return txt(state?.portal?.tenant_id)||txt(state?.portal?.tenantId)||
        txt(state?.portal?.company?.tenant_id)||txt(state?.tenant_id)||'';
}
function goalKey(item){
 return txt(item?.goal_key||item?.goal_id||item?.metric_id||item?.metric);
}
function scoped(item,tenant,goal){
 return exact(txt(item?.tenant_id||item?.tenantId),tenant)&&exact(goalKey(item),goal);
}
function receiptIsVerified(receipt,tenant,actionId){
 return Boolean(receipt&&receipt.confirmed===true&&
   exact(txt(receipt.tenant_id||receipt.tenantId),tenant)&&
   exact(txt(receipt.action_id||receipt.actionId),actionId)&&
   txt(receipt.provider)&&txt(receipt.id)&&iso(receipt.verified_at||receipt.verifiedAt));
}
function outcomeIsVerified(outcome,tenant,actionId){
 return Boolean(outcome&&exact(txt(outcome.tenant_id||outcome.tenantId),tenant)&&
   exact(txt(outcome.action_id||outcome.actionId),actionId)&&
   ['OUTCOME_VERIFIED','REALIZED_VERIFIED'].includes(txt(outcome.verification_status).toUpperCase())&&
   refs(outcome.source_refs||outcome.sourceRefs).length&&
   iso(outcome.verified_at||outcome.verifiedAt));
}
export function buildDecisionTwinReceipt(state={},foresight={}){
 const m=foresight?.active||{},scenario=foresight?.scenario||null;
 const goal=txt(m.id),tenant=scopeFor(state),history=list(m.history);
 const evidence=refs(history.map(p=>p?.evidenceRef));
 const hasHistory=Boolean(goal&&scenario?.kind==='WHAT_IF_NOT_PREDICTION'&&
   Number.isFinite(scenario.baseline)&&Number.isFinite(scenario.simulated)&&
   history.length>=3&&evidence.length>0);
 const foundation={version:'decision-twin-receipt-v1',
   goal,tenantBound:Boolean(tenant),status:'INSUFFICIENT_EVIDENCE',
   scenarioKind:hasHistory?'WHAT_IF_NOT_PREDICTION':null,
   sourceRefs:evidence,baseline:hasHistory?scenario.baseline:null,
   simulated:hasHistory?scenario.simulated:null,
   estimatedEffect:null,realizedEffect:null,
   actionId:null,providerReceipt:null,outcomeId:null};
 if(!hasHistory)return foundation;
 foundation.status='SIMULATION_ONLY';
 if(!tenant)return foundation;
 const actions=[
   ...list(state?.powerhouse?.executive?.next_best_actions),
   ...list(state?.powerhouse?.actions),
   ...list(state?.powerhouse?.decisions)
 ];
 const action=actions.find(a=>scoped(a,tenant,goal)&&
    txt(a.id||a.action_id)&&refs(a.source_refs||a.sourceRefs).length>0);
 if(!action)return foundation;
 foundation.actionId=txt(action.id||action.action_id);
 foundation.status='ACTION_PROPOSED';
 const receipts=[
   ...list(state?.powerhouse?.provider_receipts),
   ...list(state?.powerhouse?.executive?.provider_receipts)
 ];
 const provider=receipts.find(r=>receiptIsVerified(r,tenant,foundation.actionId));
 if(!provider)return foundation;
 foundation.providerReceipt=txt(provider.id);
 foundation.status='PROVIDER_CONFIRMED';
 const outcomes=[
   ...list(state?.powerhouse?.executive?.outcomes),
   ...list(state?.powerhouse?.outcomes)
 ];
 const outcome=outcomes.find(o=>outcomeIsVerified(o,tenant,foundation.actionId));
 if(!outcome)return foundation;
 foundation.outcomeId=txt(outcome.id||outcome.outcome_id)||null;
 foundation.realizedEffect=typeof outcome.realized_effect==='number'&&
   Number.isFinite(outcome.realized_effect)?outcome.realized_effect:null;
 foundation.status='OUTCOME_VERIFIED';
 return foundation;
}
export function renderDecisionTwinReceipt(receipt={}){
 const labels={
   INSUFFICIENT_EVIDENCE:'Geen betrouwbare scenariobasis',
   SIMULATION_ONLY:'Wat-als, geen uitvoeringsbewijs',
   ACTION_PROPOSED:'Actie voorgesteld, niet bevestigd',
   PROVIDER_CONFIRMED:'Providerbevestiging, resultaat nog niet bewezen',
   OUTCOME_VERIFIED:'Uitkomst onafhankelijk bevestigd'
 };
 const line=[
   '<section class="pfs-decision-receipt" data-pfs-decision-receipt aria-label="Decision Twin bewijs">',
   '<h4>Van voorspelling naar aantoonbare beslissing</h4>',
   '<p><strong>'+esc(labels[receipt.status]||labels.INSUFFICIENT_EVIDENCE)+'</strong></p>',
   '<p>Historische bronverwijzingen: '+esc(list(receipt.sourceRefs).length)+
   '. Een rekenkundig scenario is geen causale voorspelling of opdracht.</p>',
   receipt.actionId?'<p>Actie: '+esc(receipt.actionId)+' · '+(receipt.providerReceipt?'providerbewijs '+esc(receipt.providerReceipt):'goedkeuring/uitvoering nog niet bewezen')+'</p>':
     '<p>Geen tenantgebonden, met bronnen onderbouwde actie voor dit doel gekoppeld.</p>',
   receipt.status==='OUTCOME_VERIFIED'?'<p>Resultaat geverifieerd'+(receipt.outcomeId?' · '+esc(receipt.outcomeId):'')+'. Dit bewijst op zichzelf nog geen causaal verschil.</p>':
     '<p>Gerealiseerd effect: nog niet onafhankelijk gemeten.</p>',
   '<button type="button" data-pfs-page="next-best-actions">Bekijk besluiten en acties →</button>',
   '</section>'
 ];
 return line.join('');
}
