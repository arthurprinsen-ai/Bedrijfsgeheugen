// ONE BRAIN guard triage: strictly read-only diagnostics from the ORIGINAL 15-loop
// stage receipts. No status mutation, no second monitoring job, no raw provider payloads.
import {loadOneLoopAssurance} from './one-loop-assurance-readback.mjs';

const RECEIPTS='public.powerhouse_loop_assurance_receipts_v1';
const DIAGNOSTIC_CONTRACT='one-brain-original-guard-diagnostics-v1';
const LIMIT=20;
const MAX_AGE_MS=20*60*1000;
const MAX_REASONS=5;
const CODES=Object.freeze({
 GLOBAL_POST_DUPLICATE_BLOCKED:'Produceer aantoonbaar nieuw verhaal in de bestaande publisher; behoud de duplicate-gate.',
 INSTAGRAM_DAILY_WINNER_REQUIRED:'Herstel de dagelijkse contentwinner binnen de bestaande Mira-generator voordat de mediarouter draait.',
 EXACT_FINAL_MEDIA_PROOF_REQUIRED:'Koppel het definitieve gevalideerde media-assetbewijs in de bestaande Instagram-lineage.',
 NO_AUTHORIZED_CANONICAL_EMAIL_EXECUTOR:'Een bevoegde, canonieke e-mailuitvoerder is nodig; geen ongevraagde externe verzending.',
 NO_AUTHORIZED_LINKEDIN_ARTICLE_EXECUTOR:'Geen geautoriseerde artikelpublicatie; behoud het menselijke autorisatiegrenspunt.',
 SILENT_PUBLICATION_FAILURE:'Herstel verzending en onafhankelijk provider-ID/readback in de originele publicatielane.',
 CHILD_CALL_FAILED:'Herstel de originele provider-aanroep en verifieer de volgende natuurlijke run.',
 CALIBRATION_DEBT_OPEN:'Herstel de oorspronkelijke voorspellingskalibratie met echte uitkomsten, geen synthetische resoluties.',
 REVENUE_NOT_VERIFIED:'Controleer betaalde providerorders en attributie; geen omzet of successen verzinnen.',
 UNHEALTHY_DATA_SOURCES:'Herstel de ongezonde bronintegraties via de originele Data Spine.',
 RUNTIME_ERRORS_OPEN:'Los bestaande runtimefouten op met oorzaak, regressie en onafhankelijk nieuw uitvoeringsbewijs.',
 SOURCE_EVIDENCE_SPARSE:'Vul bron- en uitkomstbewijs in dezelfde ONE BRAIN-lineage aan.',
 CONTENT_LOOP_GUARD_FAILED:'Controleer de oorspronkelijke publicatie- en providerreadback per kanaal.',
 FULL_CYCLE_SOURCE_UNHEALTHY:'Herstel de ontbrekende provider- of productie-readback binnen de originele Proof-lane.',
 ORIGINAL_GUARD_FAILED_REASON_UNAVAILABLE:'Bekijk oorspronkelijke guardreceipt; onderliggend veilig bewijs ontbreekt.',
 OUTREACH_ACTION_READBACK_DUE:'Laat de bestaande outreach-eigenaar de ontbrekende echte actie en providerontvangst aantonen; geen verzending zonder duplicate-gate.',
 CONTENT_PUBLICATION_STAGE_EVIDENCE_DUE:'Laat de originele Content Closed Loop-eigenaar ontbrekende besluit-, publicatie-, providerreadback-, meet-, uitkomst- en leerbewijzen herstellen; behoud kanaal- en autorisatiegates.',
 DATA_SPINE_STAGE_EVIDENCE_DUE:'Laat de oorspronkelijke Data Spine-watchdog ontbrekende bron-, actie-, guard- en uitkomstreceipts herstellen en op de volgende natuurlijke run bevestigen.',
 ORIGINAL_LOOP_STAGE_EVIDENCE_DUE:'Herstel de ontbrekende oorspronkelijke stage-receipts binnen de luseigenaar en bevestig onafhankelijke bron-/uitkomstbewijzen; geen extra job of fictief groen.',
 ORIGINAL_AMBER_EVIDENCE_DUE:'Oranje bewijstekort zonder ontbrekende stage-namen: controleer oorspronkelijke guard en providerstatus bij deze lus, niet de outreach-uitvoerder.',
 PUBLICATION_PROOF_OVERDUE:'Dagpublicatie mist providerbewijs na geplande tijd; herstel onmiddellijk via originele kanaaleigenaar en controleer de volgende natuurlijke uitvoering.',
 DISTINCT_VERIFIED_STORY_REQUIRED:'Selecteer inhoudelijk nieuw, bronbevestigd LinkedIn-verhaal; nooit de duplicate-beveiliging uitschakelen.',
 MIRA_FINAL_MEDIA_PROOF_REQUIRED:'Laat originele Mira-producer definitief video-/frame- en identiteitsbewijs valideren (minimaal 0,940).',
 MIRA_UNIQUE_SOURCE_WINNER_REQUIRED:'Laat oorspronkelijke Mira-bronagent een nieuw controleerbaar MKB-probleem met bronpublicatiedatum vinden. Behoud 90-dagen bron-/3-dagen onderwerpduplicaatcontrole; selecteer daarna exact één nieuwe dagwinnaar, vóór video en identiteitstest.',
 BLOG_APPROVAL_RELEASE_READBACK_REQUIRED:'Herstel originele bloggoedkeuring, protected merge, Netlify en exact publiek artikelbewijs.',
 EMAIL_CANONICAL_AUTHORIZATION_REQUIRED:'Herstel canonieke e-mailbevoegdheid en ontvangeropt-in; verzend nooit zonder toestemming.',
 CONTENT_GENERATION_BILLING_ACTION_REQUIRED:'Tekstgeneratie door huidige goedgekeurde AI-provider geweigerd wegens ontbrekend tegoed. Bevoegde accountbeheerder moet tegoed of formeel goedgekeurde fallback herstellen; nooit automatische betaling of uitwijkroute buiten governance.',
 EXACT_PROVIDER_PUBLICATION_PROOF_MISSING:'Controleer exact provider-ID en oorspronkelijke idempotente verzending; vermijd dubbele side effects.',
 CHANNEL_CAPABILITY_PROOF_REQUIRED:'Verifieer providerautorisatie in originele connector; benodigde menselijke OAuth-toestemming niet omzeilen.',
 PUBLICATION_SCHEDULE_MISSING:'Laat de originele planner de ontbrekende expliciete dagdeadline herstellen.'
});
const limit=x=>Number.isFinite(Number(x))?Math.max(0,Math.floor(Number(x))):null;
function parseResult(value){
 if(typeof value!=='string'||value.length>65536)return null;
 try{const obj=JSON.parse(value);return obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:null;}catch{return null;}
}
// AMBER is an incomplete stage chain, not necessarily an outreach incident.
// Derive the accountable owner exclusively from the original 15-loop key and
// original missingStages; never copy one lane's remediation to another lane.
function missingStageAction(row){
 const missing=Array.isArray(row?.missingStages)?row.missingStages:[];
 if(!missing.length)return 'ORIGINAL_AMBER_EVIDENCE_DUE';
 if(row.key==='autonomous-outreach' &&
    (missing.includes('action')||missing.includes('readback')))return 'OUTREACH_ACTION_READBACK_DUE';
 if(row.key==='content-closed-loop')return 'CONTENT_PUBLICATION_STAGE_EVIDENCE_DUE';
 if(row.key==='data-spine-watchdog')return 'DATA_SPINE_STAGE_EVIDENCE_DUE';
 return 'ORIGINAL_LOOP_STAGE_EVIDENCE_DUE';
}
function collectGuardCodes(row,receipt){
 if(row.status==='GREEN')return [];
 if(row.status==='AMBER')return [missingStageAction(row)];
 if(!receipt||receipt.evidence?.pass===undefined)return ['ORIGINAL_GUARD_FAILED_REASON_UNAVAILABLE'];
 const e=receipt.evidence||{},codes=[];
 const add=c=>{if(CODES[c]&&!codes.includes(c))codes.push(c);};
 if(row.key==='content-closed-loop'){
  const state=e.state||{},result=parseResult(state.result);
  if(Array.isArray(result?.recovery?.overdue)&&result.recovery.overdue.length){
   add('PUBLICATION_PROOF_OVERDUE');
   for(const problem of result.recovery.overdue){
    if(typeof problem?.code==='string'&&CODES[problem.code])add(problem.code);
   }
  }
  for(const boundary of result?.hardBoundaries||[]){
   if(typeof boundary?.reason==='string'&&CODES[boundary.reason])add(boundary.reason);
  }
  for(const o of result?.obligations||[]){
   if(String(o?.last_error||'').startsWith('GLOBAL_POST_DUPLICATE_BLOCKED'))add('GLOBAL_POST_DUPLICATE_BLOCKED');
   if(o?.last_error==='SILENT_PUBLICATION_FAILURE')add('SILENT_PUBLICATION_FAILURE');
  }
  for(const step of result?.steps||[]){
   if(step?.error==='INSTAGRAM_DAILY_WINNER_REQUIRED')add('INSTAGRAM_DAILY_WINNER_REQUIRED');
   if(step?.error==='CHILD_CALL_FAILED')add('CHILD_CALL_FAILED');
  }
  if(state.status==='BLOCKED')add('CONTENT_LOOP_GUARD_FAILED');
 }else if(row.key==='revenue-flywheel'){
  if(e.health?.calibration_gap===true||limit(e.health?.due_uncalibrated_forecasts)>0)add('CALIBRATION_DEBT_OPEN');
  if(e.health?.realized_revenue_eur===0)add('REVENUE_NOT_VERIFIED');
 }else if(row.key==='one-brain-reconcile'){
  if(limit(e.health?.current_runtime_errors)>0)add('RUNTIME_ERRORS_OPEN');
  if(limit(e.health?.evidence_sparse_required_layers)>0)add('SOURCE_EVIDENCE_SPARSE');
  if(e.health?.content_loop_state==='BLOCKED')add('CONTENT_LOOP_GUARD_FAILED');
 }else if(row.key==='data-spine-watchdog'){
  if(limit(e.unhealthy_sources)>0)add('UNHEALTHY_DATA_SOURCES');
 }else if(row.key==='daily-compound-learning'){
  if(limit(e.runtime_evidence?.control?.forecast_resolution_debt)>0)add('CALIBRATION_DEBT_OPEN');
 }else if(row.key==='full-cycle-production-proof'){
  if(e.proof?.healthy===false)add('FULL_CYCLE_SOURCE_UNHEALTHY');
 }
 if(!codes.length)add('ORIGINAL_GUARD_FAILED_REASON_UNAVAILABLE');
 return codes.slice(0,MAX_REASONS);
}
const CHANNEL_LABELS=Object.freeze({
 linkedin_personal:'LinkedIn persoonlijk',linkedin_company:'LinkedIn bedrijf',
 instagram:'Instagram / Mira',blog:'Blog',email_newsletter:'E-mail'
});
function safePublicationRecovery(row,receipt){
 if(row.key!=='content-closed-loop'||!receipt||row.status==='GREEN')return [];
 const parsed=parseResult(receipt.evidence?.state?.result);
 if(parsed?.recovery?.contract!=='one-brain-publication-no-silent-gap-v1')return [];
 return (Array.isArray(parsed.recovery.overdue)?parsed.recovery.overdue:[])
   .filter(x=>typeof x?.channel==='string'&&CHANNEL_LABELS[x.channel]&&CODES[x.code])
   .slice(0,5).map(x=>Object.freeze({
    channel:x.channel,label:CHANNEL_LABELS[x.channel],code:x.code,
    nextAction:CODES[x.code],scheduledFor:Number.isFinite(Date.parse(x.scheduledFor||''))?
      new Date(x.scheduledFor).toISOString():null
   }));
}
const denied=reason=>Object.freeze({contract:DIAGNOSTIC_CONTRACT,status:'UNAVAILABLE',reason,
  source:RECEIPTS,observedAt:null,cases:[],allGreen:false});
export function projectOriginalGuardDiagnostics(assurance,receipts,{observedAt=new Date().toISOString()}={}){
 if(assurance?.status!=='READBACK_COMPLETE'||!Array.isArray(assurance.loops)||assurance.loops.length!==15)return denied('CANONICAL_ASSURANCE_UNVERIFIED');
 if(!Array.isArray(receipts)||receipts.length>LIMIT)return denied('ORIGINAL_GUARD_RECEIPTS_TRUNCATED_OR_UNAVAILABLE');
 const now=Date.parse(observedAt);
 if(!Number.isFinite(now))return denied('SERVER_OBSERVATION_INVALID');
 const byKey=new Map();
 for(const receipt of receipts){
  if(!receipt||receipt.stage!=='guard'||typeof receipt.loop_key!=='string'||byKey.has(receipt.loop_key))
    return denied('ORIGINAL_GUARD_RECEIPT_IDENTITY_INVALID');
  const time=Date.parse(receipt.observed_at||'');
  if(!Number.isFinite(time)||time>now+60000||now-time>MAX_AGE_MS)continue;
  byKey.set(receipt.loop_key,receipt);
 }
 const cases=assurance.loops.filter(row=>row.status!=='GREEN').map(row=>{
  const receipt=byKey.get(row.key);
  const codes=collectGuardCodes(row,receipt);
  const guardEvidence=receipt?receipt.evidence?.pass===false?'FAILED':
    receipt.evidence?.pass===true?'PASSED':'NOT_RECORDED':'NOT_READ_BACK';
  return Object.freeze({key:row.key,status:row.status,guardEvidence,
   guardReceiptAt:receipt?.observed_at||null,
   reasons:codes.map(code=>Object.freeze({code,nextAction:CODES[code]})),
   publicationRecovery:safePublicationRecovery(row,receipt),
   missingStages:[...row.missingStages],source:receipt?RECEIPTS:null,
   verifiedOutcome:false});
 });
 return Object.freeze({contract:DIAGNOSTIC_CONTRACT,status:'READBACK_COMPLETE',
  source:RECEIPTS,observedAt,cases,allGreen:cases.length===0});
}
export async function loadOneLoopAssuranceWithDiagnostics({baseUrl='',key='',fetchImpl=globalThis.fetch,now=()=>new Date().toISOString()}={}){
 const assurance=await loadOneLoopAssurance({baseUrl,key,fetchImpl,now});
 if(assurance.status!=='READBACK_COMPLETE')return {...assurance,guardDiagnostics:denied('CANONICAL_ASSURANCE_UNVERIFIED')};
 if(!/^https:\/\//.test(baseUrl)||!key)return {...assurance,guardDiagnostics:denied('ORIGINAL_GUARD_READBACK_NOT_CONFIGURED')};
 try{
  const url=new URL('/rest/v1/powerhouse_loop_assurance_receipts_v1',baseUrl);
  url.searchParams.set('select','loop_key,stage,observed_at,evidence');
  url.searchParams.set('stage','eq.guard');
  url.searchParams.set('limit',String(LIMIT));
  const response=await fetchImpl(url.toString(),{method:'GET',
   headers:{apikey:key,authorization:`Bearer ${key}`,accept:'application/json'},
   signal:AbortSignal.timeout(5000)});
  if(!response?.ok)return {...assurance,guardDiagnostics:denied('ORIGINAL_GUARD_PROVIDER_'+(Number(response?.status)||'UNKNOWN'))};
  const rows=await response.json().catch(()=>null);
  return {...assurance,guardDiagnostics:projectOriginalGuardDiagnostics(assurance,rows,{observedAt:now()})};
 }catch{return {...assurance,guardDiagnostics:denied('ORIGINAL_GUARD_READBACK_FAILED')};}
}
