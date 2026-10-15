/**
 * Powerhouse · één ondernemerservaring boven de bestaande tenantgebonden OS-projectie.
 * Geen eigen database, geen tweede actieketen en geen sample-cijfers in klantweergaven.
 */
import {buildExecutiveProjection} from './operating-system/executive-projection.js';
import {classifyActionRisk,evaluateActionEligibility} from './operating-system/action-policy.js';

export const OWNER_AREAS=Object.freeze([
 Object.freeze({id:'bedrijf',label:'Mijn bedrijf',description:'Gezondheid, cash, marge, voortgang en risico'}),
 Object.freeze({id:'kansen',label:'Mijn kansen',description:'Omzet, klantbehoud en verbeterpotentieel'}),
 Object.freeze({id:'acties',label:'Mijn acties',description:'Voorstellen, besluiten, uitvoering en resultaat'}),
 Object.freeze({id:'adviseur',label:'Mijn adviseur',description:'Vraag, verklaring en scenario met bronbewijs'}),
 Object.freeze({id:'instellingen',label:'Mijn instellingen',description:'Bronnen, rollen, toestemming en AI-soevereiniteit'})
]);
const verified=item=>item?.evidence_health?.status==='healthy' && Array.isArray(item?.source_refs) && item.source_refs.length>0;
const arr=x=>Array.isArray(x)?x:[];
const val=x=>String(x??'').trim();
const categories=Object.freeze({
 finance:/finance|cash|liquid|marge|winst|kosten|factur|debiteur|betaling|prijs|omzetverlies/i,
 groei:/sales|lead|verkoop|omzet|acquisi|prospect|groei|cross.sell|up.sell/i,
 klanten:/klant|contractverleng|retentie|tevreden|churn|complaint|verloop/i,
 operatie:/werkdruk|capaciteit|levering|planning|proces|project|medewerker|uren|efficien|doorlooptijd/i,
 risico:/risico|compliance|regelgeving|security|privacy|continuiteit/i
});
export function ownerCategory(item={}){
 const raw=[item.domain,item.category,item.type,item.title,item.summary].filter(Boolean).join(' ');
 return Object.entries(categories).find(([,pattern])=>pattern.test(raw))?.[0]||'strategie';
}
function actionSafety(item){
 const risk=classifyActionRisk(item);
 const check=evaluateActionEligibility({...item,risk_class:risk},{approved:false,policy_allowed:false});
 const level=risk===0?'inzage':(risk>=2||check.state==='APPROVAL_REQUIRED')?'goedkeuring':risk===1&&check.eligible&&check.state==='AUTO_APPROVED'?'binnen-beleid':'niet-uitvoerbaar';
 return Object.freeze({risk,level,eligibility:check.state,reason:check.reason||null});
}
export function buildOwnerOperatingModel(state={}, {now=Date.now()}={}){
 const tenantId=val(state?.tenant_id||state?.powerhouse?.tenant_id);
 const authScope=Boolean(tenantId && state?.powerhouse?.executive && typeof state.powerhouse.executive==='object');
 const projection=buildExecutiveProjection(authScope?state:{},{tenantId:tenantId||undefined,now});
 const actions=projection.next_best_actions.filter(verified).map(item=>Object.freeze({...item,ownerSafety:actionSafety(item),ownerCategory:ownerCategory(item)}));
 const opportunities=projection.opportunities.filter(verified).map(item=>Object.freeze({...item,ownerCategory:ownerCategory(item)}));
 const risks=projection.risks.filter(verified);
 const forecasts=projection.forecasts.filter(verified);
 const outcomes=projection.outcomes.filter(item=>verified(item)&&['VERIFIED','OUTCOME_VERIFIED','REALIZED_VERIFIED'].includes(val(item.verification_status||item.status).toUpperCase()));
 const attention=projection.attention.filter(verified).slice(0,3);
 const decisions=actions.filter(item=>item.ownerSafety.level==='goedkeuring'||item.decision_required||item.approval_required||['PROPOSED','PENDING_APPROVAL'].includes(val(item.status).toUpperCase()));
 const all=[...actions,...opportunities,...risks,...forecasts,...outcomes];
 return Object.freeze({
  ready:authScope,tenantId:tenantId||null,
  labels:OWNER_AREAS,
  attention,
  actions,
  opportunities,
  risks,
  forecasts,
  outcomes,
  decisions,
  counts:Object.freeze({kansen:opportunities.length,risicos:risks.length,besluiten:decisions.length,acties:actions.length,uitkomsten:outcomes.length}),
  categories:Object.freeze(Object.fromEntries(['finance','groei','klanten','operatie','risico','strategie'].map(key=>[key,Object.freeze([...actions,...opportunities].filter(item=>item.ownerCategory===key))]))),
  proof:Object.freeze({verified:all.length,unavailable:projection.evidence_health.unavailable,stale:projection.evidence_health.stale,lowConfidence:projection.evidence_health.low_confidence}),
  // Bedragen mogen pas worden getoond via een expliciet geverifieerde financiële bron.
  // De OS-projectie garandeert geen financiële bron voor omzet, marge of cash.
  finance:Object.freeze({revenue:null,cash30Days:null,margin:null}),
  autonomousExecutionVerified:false
 });
}
