// One frozen winner governs Instagram media and caption lineage. Never replace
// an externally sourced daily problem with an unrelated modulo PH-P rotation.
import {MIRA_CASES,selectMiraProblem,miraCaption as legacyCaption,miraProductionEvidence as legacyEvidence,validateMiraCaptionForDelivery as legacyValidate} from './mira-entrepreneur-caption.mjs';
// Source-specific editorial approval is immutable repository policy, NOT a
// user-controllable property of the external complaint/recommendation.
export const MIRA_SOURCE_LED_CAPTION_CONTRACT='mira-source-led-illustrated-privacy-case-v1';
const APPROVED_SOURCE_LED=Object.freeze({
 '2026-10-23:7880c326-72b8-4ac8-a712-971a9a24de12':Object.freeze({
  source_hash:'4ecd49bcc431b85a5cc16d3f9fc1cc7604e60cf912ca5b22f8ac72cdff1c9eee',
  source_url:'https://www.klacht.nl/klacht-nl/klacht/verwijdering-van-persoonlijke-gegevens-uit-klachten/',
  source_title:'Verwijdering van persoonlijke gegevens uit klachten',
  openart_history_id:'S2WRHcZAKIV5Cxn2tZLE',
  asset_url:'https://cdn.openart.ai/openart-ai/production/2026-10/create-video/WZvuT1BzGx566fWaFo8F/sample_0_1792734075917_40938741.mp4',
  scene:'Mira overdenkt wat er met kopieën gebeurt wanneer persoonsgegevens uit een online klacht moeten worden verwijderd.',
  caption:[
   'Je vraagt of je naam uit een online klacht kan worden gehaald.',
   'Maar waar staan die gegevens nog meer? Eén aanpassing op één plek bewijst niet dat kopieën ook zijn bijgewerkt.',
   'Mira zou daarom eerst de vindplaatsen controleren, één verantwoordelijke aanwijzen en de verwijdering daarna verifiëren.',
   'De pointe: iets wissen is eenvoudig. Zeker weten dat het overal weg is, vraagt overzicht.',
   'Een fictieve Mira-situatie, geïnspireerd op een openbare klacht over persoonsgegevens. Geen echte klantervaring en geen bewezen uitkomst.'
  ].join('\n\n')
 })
});
const normalize = value => String(value??'').replace(/\s+/g,' ').trim();
export function miraResolvedCaption(resolved) {
 if(resolved?.kind==='approved_source_led')return resolved.caption;
 if(resolved?.kind==='approved_frozen_library_mapping'||resolved?.kind==='pre_freeze_legacy'){
  return legacyCaption(resolved.problem);
 }
 throw new Error('MIRA_UNAPPROVED_EDITORIAL_ROUTE');
}
export function miraResolvedEvidence(resolved){
 if(resolved?.kind==='approved_source_led')return {
  contentPersona:'mira',contentClass:'mira_daily_life',fictional_scene:true,
  caption_contract:MIRA_SOURCE_LED_CAPTION_CONTRACT,
  mira_source_led:true,mira_source_hash:resolved.source_hash,
  mira_winner_recommendation_id:resolved.winner_recommendation_id,
  mira_entrepreneur_scene:resolved.scene,mira_openart_history_id:resolved.openart_history_id,
  mira_source_asset_url:resolved.asset_url,
  source_evidence_status:'FROZEN_PUBLIC_EXTERNAL_SOURCE',
  source_url:resolved.source_url
 };
 if(resolved?.problem)return legacyEvidence(resolved.problem);
 throw new Error('MIRA_UNAPPROVED_EDITORIAL_EVIDENCE');
}
export function validateResolvedMiraCaptionForDelivery(runDate,body,evidence={}){
 const id=clean(evidence.mira_winner_recommendation_id);
 const approved=APPROVED_SOURCE_LED[runDate+':'+id];
 if(evidence.mira_source_led===true){
  if(!approved||evidence.caption_contract!==MIRA_SOURCE_LED_CAPTION_CONTRACT||
    clean(evidence.mira_source_hash)!==approved.source_hash||
    clean(evidence.mira_entrepreneur_scene)!==approved.scene||
    clean(evidence.mira_openart_history_id)!==approved.openart_history_id||
    clean(evidence.mira_source_asset_url)!==approved.asset_url||
    clean(evidence.source_url)!==approved.source_url||
    normalize(body)!==normalize(approved.caption))
   return {ok:false,reason:'MIRA_FROZEN_SOURCE_LED_CAPTION_PROOF_FAILED'};
  return {ok:true,kind:'approved_source_led',winner_recommendation_id:id};
 }
 if(id)return {ok:false,reason:'MIRA_FROZEN_WINNER_REQUIRES_EXPLICIT_CAPTION_ROUTE'};
 return legacyValidate(runDate,body,evidence);
}


const clean = value => String(value ?? '').trim();
const blocked = (code,winnerId='') => ({ok:false,code,winner_recommendation_id:winnerId||null});

export function resolveMiraFrozenWinner(runDate,{winner=null,lineage=null,recommendation=null,job=null}={}){
  const fallback=selectMiraProblem(runDate);
  const claimed=clean(job?.asset_manifest?.daily_winner_recommendation_id||job?.asset_manifest?.recommendation_id);
  if(!winner){
    if(claimed||lineage) return blocked('INSTAGRAM_FROZEN_WINNER_MISSING',claimed);
    return {ok:true,problem:fallback,kind:'pre_freeze_legacy',winner_recommendation_id:null};
  }
  const id=clean(winner.recommendation_id);
  if(!id||!lineage||clean(lineage.run_date)!==runDate||
    !['WINNER_FROZEN','LIVE_PROVEN'].includes(clean(lineage.state))||
    clean(lineage.winner_recommendation_id)!==id||
    clean(recommendation?.recommendation_id)!==id||
    (claimed&&claimed!==id)) return blocked('INSTAGRAM_FROZEN_WINNER_LINEAGE_CONFLICT',id);
  const evidence=recommendation?.evidence||{};
  const source=lineage.source_evidence||{};
  if(clean(recommendation?.status)!=='accepted'||
    evidence.source_backed!==true||
    !clean(source.source_hash)||
    !clean(source.source_url).startsWith('https://')||
    clean(source.source_url)!==clean(evidence.source_url)||
    !clean(evidence.source_title))return blocked('INSTAGRAM_FROZEN_SOURCE_PROVENANCE_UNVERIFIED',id);
  // A fixed editorially approved source-led scene is NOT a fabricated PH-P
  // business attribution; all downstream exact-video vision gates still apply.
  if(evidence.forced_business_bridge_forbidden===true||
    evidence.office_problem_attribution_forbidden===true){
    const approved=APPROVED_SOURCE_LED[runDate+':'+id];
    if(!approved||clean(source.source_hash)!==approved.source_hash||
      clean(source.source_url)!==approved.source_url||
      clean(evidence.source_title)!==approved.source_title)
      return blocked('SOURCE_BACKED_MIRA_SCENE_ROUTE_REQUIRED',id);
    return {ok:true,kind:'approved_source_led',
      winner_recommendation_id:id,source_url:approved.source_url,
      source_hash:approved.source_hash,scene:approved.scene,
      caption:approved.caption,openart_history_id:approved.openart_history_id,asset_url:approved.asset_url,
      caption_contract:MIRA_SOURCE_LED_CAPTION_CONTRACT};
  }
  const approvedId=clean(evidence.approved_canonical_problem_id);
  const approvedScene=clean(evidence.approved_mira_scene);
  const problem=MIRA_CASES.find(candidate=>candidate.id===approvedId);
  if(!problem)return blocked('CANONICAL_WINNER_NOT_LIBRARY_MAPPED',id);
  if(!approvedScene||approvedScene!==problem.scene)
    return blocked('WINNER_SCENE_UNVERIFIED',id);
  return {ok:true,kind:'approved_frozen_library_mapping',problem,
    winner_recommendation_id:id,source_url:source.source_url,source_hash:source.source_hash};
}


/**
 * One-time, CAS-protected candidate re-use for the original Heartbeat media
 * router. This only materializes existing completed OpenArt bytes; it never
 * generates, approves, publishes, or creates another scheduler.
 */
export function sourceLedAutoVerifyCandidate({runDate,resolved,job,ob,postType,readyProviders=[]}={}){
 const id=clean(resolved?.winner_recommendation_id);
 const manifest=job?.asset_manifest||{};
 const reserved=clean(manifest.daily_winner_recommendation_id||manifest.recommendation_id);
 if(resolved?.kind!=='approved_source_led'||!id||!runDate||
   postType!=='reel'||job?.status!=='WAITING_ASSET'||
   Number(job?.attempts)!==0||!clean(job?.id)||!clean(job?.updated_at)||
   !readyProviders.includes('openart')||
   !clean(resolved.asset_url).startsWith('https://cdn.openart.ai/')||
   !clean(resolved.asset_url).endsWith('.mp4')||
   !clean(resolved.openart_history_id)||
   (reserved&&reserved!==id)||
   ob?.external_id||ob?.evidence?.republish_forbidden===true||
   job?.republish_forbidden===true||
   manifest.automatic_generation_budget_exhausted===true||
   manifest.source_led_auto_verify_started===true)
   return {ok:false,reason:'NOT_ELIGIBLE_FOR_SINGLE_PROOF_ATTEMPT'};
 return {ok:true,provider:'openart',assetManifest:{
   ...manifest,
   source_led_auto_verify_started:true,
   source_led_auto_verify_contract:'mira-frozen-approved-existing-asset-only-v1',
   recommendation_id:id,
   daily_winner_recommendation_id:id,
   scene:resolved.scene,
   asset_url:resolved.asset_url,
   openart_history_id:resolved.openart_history_id,
   openart_reference_id:'Yjqu4D7v76HABNPmQPj1',
   openart_reference_url:'https://cdn.openart.ai/openart-ai/production/2026-09/create-image/WZvuT1BzGx566fWaFo8F/image_1790665568080_41c2e10a_1790665568142_c6e526dd.jpg',
   generation_mode:'image2video',
   duration:8
 }};
}
