// One frozen winner governs Instagram media and caption lineage. Never replace
// an externally sourced daily problem with an unrelated modulo PH-P rotation.
import {MIRA_CASES,selectMiraProblem,miraCaption as legacyCaption,miraProductionEvidence as legacyEvidence,validateMiraCaptionForDelivery as legacyValidate} from './mira-entrepreneur-caption.mjs';
import {MIRA_MASTER_REFERENCE_ID,MIRA_MASTER_REFERENCE_URL,miraFaceProofValid,validMiraGenerationReference} from './mira-canonical-face.mjs';
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
 }),
 '2026-10-25:0a56f150-2954-4355-a3d0-fc65396f8152':Object.freeze({
  source_hash:'9d111ed60c5510e7fe41e8e9184c4055dd01363dd2ae78dc20c64845a1572665',
  source_url:'https://www.nu.nl/auto/6227593/steeds-meer-betaalapps-voor-het-parkeren-dit-zijn-de-verschillen.html',
  source_title:'Steeds meer betaalapps voor het parkeren: dit zijn de ...',
  openart_history_id:'qAUQW2ZzqdasS0ePb1PD',
  asset_url:'https://cdn.openart.ai/openart-ai/production/2026-10/create-video/WZvuT1BzGx566fWaFo8F/sample_0_1792920844481_30d6b469.mp4',
  caption_contract:'mira-source-led-illustrated-parking-friction-v1',
  scene:'Mira kijkt in een rustige Nederlandse werkkamer naar haar telefoon met meerdere generieke parkeerapp-icoontjes op een scherm; haar gezicht blijft onveranderd.',
  title:'Mira: hoeveel parkeerapps heb je nodig?',
  cta:'Hoeveel parkeerapps staan er op jouw telefoon?',
  focus_keyword:'parkeerapps',
  meta_description:'Een fictief herkenbaar Mira-moment over verschillende parkeerapps. Geen klantclaim of advies over een aanbieder.',
  caption:[
   'Parkeerplek gevonden. En dan moet je bedenken: met welke app betaal ik hier ook alweer?',
   'Op de telefoon staan er meerdere. Ze lijken hetzelfde te doen, maar de keuze is niet altijd vanzelfsprekend.',
   'Mira kijkt naar het scherm. Nog een icoontje erbij? Ze wilde gewoon haar auto parkeren.',
   'De pointe: soms wordt iets eenvoudigs ingewikkeld door alle manieren waarop je het kunt regelen.',
   'Een fictieve Mira-situatie, geïnspireerd op een NU.nl-artikel uit oktober 2022 over parkeerapps. Geen echte klantervaring of uitspraak over een specifieke parkeerapp.'
  ].join('\n\n')
 })
});

/**
 * A frozen winner fixes the editorial source and scene, not a demonstrably
 * rejected OpenArt generation forever. This is ONLY an admission to run the
 * existing independent final-media verifier, never a PASS or publish right.
 */
export function eligibleSourceLedMediaReplacement({resolved,job,ob,manifest}={}){
 const previous=job?.asset_manifest||{};
 const rejected=String(job?.last_error||'');
 const qualityRejection=/(?:VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH|MIRA_CONTINUOUS_VIDEO_PROOF_REQUIRED)/.test(rejected);
 const rejectedHistory=/:openart=([A-Za-z0-9]+)$/.exec(rejected)?.[1]||'';
 const next=manifest||{};
 const original=String(resolved?.original_openart_history_id||resolved?.openart_history_id||'');
 const newUrl=String(next.asset_url||'');
 return resolved?.kind==='approved_source_led'
  &&job?.status==='WAITING_PROOF'
  &&qualityRejection
  &&rejectedHistory
  &&String(next.openart_history_id||'')!==rejectedHistory
  &&previous.source_led_auto_verify_started===true
  &&String(previous.openart_history_id||'')===original
  &&(!job?.proof_manifest?.exact_final_media_proven)
  &&!ob?.external_id&&!ob?.live_proven_at&&!ob?.evidence?.republish_forbidden
  &&job?.republish_forbidden!==true
  &&String(next.recommendation_id||'')===String(resolved.winner_recommendation_id)
  &&String(next.daily_winner_recommendation_id||'')===String(resolved.winner_recommendation_id)
  &&String(next.scene||'')===String(resolved.scene)
  &&String(next.replacement_of_openart_history_id||'')===original
  &&String(next.openart_history_id||'')!==original
  &&Boolean(String(next.openart_history_id||''))
  &&String(next.openart_project_id||'')===String(previous.openart_project_id||'')
  &&Boolean(String(next.openart_project_id||''))
  &&next.generation_mode==='image2video'
  &&validMiraGenerationReference(next)
  &&newUrl.startsWith('https://cdn.openart.ai/')
  &&newUrl.endsWith('.mp4')
  &&newUrl!==String(resolved.asset_url||'');
}

/**
 * Promote only evidence written by the SAME canonical router after real
 * SHA-256, three-frame master-face and temporal verification. Never trust
 * a proposed replacement's input metadata as production media truth.
 */
export function verifiedSourceLedMediaReplacement(approved,winnerId,job){
 const manifest=job?.asset_manifest||{};
 const proof=job?.proof_manifest||{};
 const url=String(manifest.asset_url||''),id=String(manifest.openart_history_id||'');
 const valid= ['PROOF_VERIFIED','READY_TO_PUBLISH','LIVE_PROVEN'].includes(String(job?.status||''))
  &&job?.republish_forbidden!==true
  &&!job?.replacement_of_external_id
  &&manifest.replacement_of_openart_history_id===approved.openart_history_id
  &&id&&id!==approved.openart_history_id
  &&url.startsWith('https://cdn.openart.ai/')&&url.endsWith('.mp4')
  &&url!==approved.asset_url
  &&validMiraGenerationReference(manifest)
  &&proof.exact_final_media_proven===true
  &&proof.mira_source_led===true
  &&proof.mira_source_hash===approved.source_hash
  &&proof.mira_winner_recommendation_id===winnerId
  &&proof.mira_entrepreneur_scene===approved.scene
  &&proof.media_provider==='openart'&&proof.media_type==='reel'
  &&proof.media_url===url
  &&proof.mira_generation_source?.openart_history_id===id
  &&proof.mira_generation_source?.openart_reference_id===MIRA_MASTER_REFERENCE_ID
  &&proof.mira_generation_source?.openart_reference_url===MIRA_MASTER_REFERENCE_URL
  &&/^[a-f0-9]{64}$/.test(String(proof.final_media_sha256||''))
  &&proof.temporal_proof?.verified===true
  &&miraFaceProofValid(proof.instagram_visual||{},'reel');
 return valid?{asset_url:url,openart_history_id:id,
  replacement_media_verified:true,original_openart_history_id:approved.openart_history_id}:null;
}

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
  caption_contract:resolved.caption_contract||MIRA_SOURCE_LED_CAPTION_CONTRACT,
  mira_source_led:true,mira_source_hash:resolved.source_hash,
  mira_winner_recommendation_id:resolved.winner_recommendation_id,
  mira_entrepreneur_scene:resolved.scene,mira_openart_history_id:resolved.openart_history_id,
  mira_source_asset_url:resolved.asset_url,
  mira_replacement_of_openart_history_id:resolved.replacement_media_verified===true?resolved.original_openart_history_id:null,
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
  const proof=evidence.instagram_media_proof||{};
  const approvedOriginal=clean(evidence.mira_openart_history_id)===approved?.openart_history_id
    &&clean(evidence.mira_source_asset_url)===approved?.asset_url
    &&!clean(evidence.mira_replacement_of_openart_history_id);
  const verifiedReplacement=!!approved
    &&clean(evidence.mira_replacement_of_openart_history_id)===approved.openart_history_id
    &&clean(evidence.mira_openart_history_id)!==approved.openart_history_id
    &&clean(evidence.mira_source_asset_url)!==approved.asset_url
    &&clean(evidence.mira_source_asset_url).startsWith('https://cdn.openart.ai/')
    &&proof.exact_final_media_proven===true
    &&proof.mira_source_led===true
    &&clean(proof.mira_source_hash)===approved.source_hash
    &&clean(proof.mira_winner_recommendation_id)===id
    &&clean(proof.mira_entrepreneur_scene)===approved.scene
    &&clean(proof.media_url)===clean(evidence.mira_source_asset_url)
    &&clean(proof.mira_generation_source?.openart_history_id)===clean(evidence.mira_openart_history_id)
    &&clean(proof.mira_generation_source?.openart_reference_id)===MIRA_MASTER_REFERENCE_ID
    &&clean(proof.mira_generation_source?.openart_reference_url)===MIRA_MASTER_REFERENCE_URL
    &&/^[a-f0-9]{64}$/.test(clean(proof.final_media_sha256))
    &&proof.temporal_proof?.verified===true
    &&miraFaceProofValid(proof.instagram_visual||{},'reel');
  if(!approved||evidence.caption_contract!==(approved.caption_contract||MIRA_SOURCE_LED_CAPTION_CONTRACT)||
    clean(evidence.mira_source_hash)!==approved.source_hash||
    clean(evidence.mira_entrepreneur_scene)!==approved.scene||
    !(approvedOriginal||verifiedReplacement)||
    clean(evidence.source_url)!==approved.source_url||
    normalize(body)!==normalize(approved.caption))
   return {ok:false,reason:'MIRA_FROZEN_SOURCE_LED_CAPTION_PROOF_FAILED'};
  return {ok:true,kind:'approved_source_led',winner_recommendation_id:id,
   verified_replacement:verifiedReplacement};
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
    const replacement=verifiedSourceLedMediaReplacement(approved,id,job);
    return {ok:true,kind:'approved_source_led',
      winner_recommendation_id:id,source_url:approved.source_url,
      source_hash:approved.source_hash,scene:approved.scene,
      caption:approved.caption,openart_history_id:replacement?.openart_history_id||approved.openart_history_id,
      asset_url:replacement?.asset_url||approved.asset_url,
      replacement_media_verified:replacement?.replacement_media_verified===true,
      original_openart_history_id:approved.openart_history_id,
      caption_contract:approved.caption_contract||MIRA_SOURCE_LED_CAPTION_CONTRACT,
      title:approved.title||'Mira: een herkenbare situatie',
      cta:approved.cta||'Wat zou jij doen?',
      focus_keyword:approved.focus_keyword||'dagelijks digitaal gedoe',
      meta_description:approved.meta_description||'Een fictieve Mira-situatie geïnspireerd op een openbaar bericht.'};
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
   openart_reference_id:MIRA_MASTER_REFERENCE_ID,
   openart_reference_url:MIRA_MASTER_REFERENCE_URL,
   generation_mode:'image2video',
   duration:8
 }};
}


// Recover only an interrupted/recoverable proof of the SAME frozen asset.
// It cannot produce a new video, change editorial source, approve identity,
// or dispatch a provider post. At most two further attempts, with backoff.
export function sourceLedRecoverableProofRetry({runDate,resolved,job,ob,postType,readyProviders=[],now=Date.now()}={}){
 const manifest=job?.asset_manifest||{};
 const id=clean(resolved?.winner_recommendation_id);
 const attempts=Number(job?.attempts);
 const lastUpdated=Date.parse(clean(job?.updated_at));
 const age=now-lastUpdated;
 const error=clean(job?.last_error);
 const allowedError=/^(MIRA_AUTO_PROOF_TRANSPORT_FAILED|MIRA_AUTO_PROOF_FAILED:(VIDEO_FRAME_EXTRACTION_FAILED|MEDIA_FETCH_FAILED|MIRA_EXACT_VIDEO_PROOF_INCOMPLETE))$/.test(error);
 const abandoned=error==='' && age>=30*60*1000;
 const backoffMs=attempts===1?10*60*1000:30*60*1000;
 const valid=resolved?.kind==='approved_source_led'&&!!id&&!!runDate&&
  postType==='reel'&&job?.status==='WAITING_PROOF'&&
  Number.isInteger(attempts)&&attempts>=1&&attempts<3&&
  !!clean(job?.id)&&Number.isFinite(lastUpdated)&&
  age>=backoffMs&&(allowedError||abandoned)&&
  readyProviders.includes('openart')&&
  manifest.source_led_auto_verify_started===true&&
  manifest.source_led_auto_verify_contract==='mira-frozen-approved-existing-asset-only-v1'&&
  clean(manifest.daily_winner_recommendation_id)===id&&
  clean(manifest.openart_history_id)===clean(resolved.openart_history_id)&&
  clean(manifest.asset_url)===clean(resolved.asset_url)&&
  clean(manifest.scene)===clean(resolved.scene)&&
  !job?.proof_manifest?.exact_final_media_proven&&
  !ob?.external_id&&!ob?.live_proven_at&&!ob?.evidence?.republish_forbidden&&
  ob?.status!=='LIVE_PROVEN'&&ob?.status!=='APPROVED'&&
  job?.republish_forbidden!==true;
 return valid?{ok:true,provider:'openart',assetManifest:manifest,nextAttempts:attempts+1,reason:abandoned?'STALE_BACKGROUND':'TRANSIENT_PROOF'}:
  {ok:false,reason:'NO_SAFE_RETRY'};
}
