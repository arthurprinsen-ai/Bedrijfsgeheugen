// Only independently recorded provenance already selected by BRAIN is eligible.
const c=x=>String(x??'').trim();
// Event types already used for a personal story in the recent window describe the same
// story family (same system, same figures) even when the event id differs.
export function personalSourceEventTypes(row){
 const e=row?.evidence||{};
 return [e.result_event,e.friction_event,e.source_focus_context]
  .map(v=>c(v?.event_type)).filter(Boolean);
}
export function isStalePersonalSource(row,recentTypes){
 const r=recentTypes instanceof Set?recentTypes:new Set(recentTypes||[]);
 return personalSourceEventTypes(row).some(t=>r.has(t));
}
export function buildVerifiedFounderReserve(source,date,recentTypes=[]){
 const recent=recentTypes instanceof Set?recentTypes:new Set(recentTypes||[]);
 const e=source?.evidence;
 if(!e||source?.target_channel!=='linkedin_personal'||!['suggested','accepted'].includes(source?.status)||
 !/^\d{4}-\d{2}-\d{2}$/.test(c(date))||
 e.ai_native_builder_story_verified!==true||
 e.ai_native_builder_policy!=='personal-linkedin-ai-native-builder-v1'||
 e.build_event_verified!==true||e.arthur_anchor_verified!==true||
 e.source_backed!==true||e.business_topic!==true||
 e.corporate_voice!==false||e.company_page_interchangeable!==false||
 e.forced_business_moral!==false||
 e.identity_contract!=='arthur-personal-linkedin-identity-v4'||
 e.identity_gate_version!=='channel-identity-hard-gate-v3'||
 !c(e.content_id)||!Array.isArray(e.source_lineage)||!e.source_lineage.length)return [];
 const s=[];
 const event=(v,k,focus)=>{
  if(v&&c(v.event_id)&&c(v.event_type)&&c(v.source)&&c(v.occurred_at)&&!recent.has(c(v.event_type)))
   s.push({kind:k,ref:'powerhouse_runtime_events:'+c(v.event_id),focus,
    source_context:{event_id:c(v.event_id),event_type:c(v.event_type),source:c(v.source),occurred_at:c(v.occurred_at)}});
 };
 const signal0=(Array.isArray(e.entrepreneur_problem_sources)?e.entrepreneur_problem_sources:[])
  .find(v=>v&&/^https:\/\//i.test(c(v.url))&&c(v.titel||v.title||v.onderwerp));
 if(signal0)s.push({kind:'external_business_problem',ref:'bg_externe_signalen:'+c(signal0.url),
   focus:'een extern waargenomen ondernemersprobleem, niet een eigen ervaring',
   source_context:{url:c(signal0.url),title:c(signal0.titel||signal0.title||signal0.onderwerp)}});
 event(e.result_event,'observed_progress','een daadwerkelijk waargenomen voortgangsgebeurtenis');
 event(e.friction_event,'observed_friction','een daadwerkelijk waargenomen tegenvaller of leerpunt');
 const seen=new Set();
 return s.filter(x=>{if(seen.has(x.ref))return false;seen.add(x.ref);return true;})
  .slice(0,3).map((x,i)=>({
   // A rejected same-day family cannot be reactivated by changing only an event UUID.
   // A genuinely different verified event TYPE or external SOURCE can rotate to its own
   // immutable canonical source-family recommendation while semantic dedupe remains enforced.
   dedupe_key:'founder-proof-reserve:'+date+':'+x.kind+':'+(x.source_context.event_type? 'event-type:'+x.source_context.event_type : 'source-ref:'+x.ref),
   run_date:date,topic_key:'founder-distinct:'+x.kind,
   content_key:'linkedin-personal-distinct:'+date+':'+x.kind+':'+(x.source_context.event_type? 'event-type:'+x.source_context.event_type : 'source-ref:'+x.ref),
   target_channel:'linkedin_personal',recommendation_type:'verified_ai_native_builder_story',
   priority:99-i,status:'suggested',
   reason:'Maak een inhoudelijk nieuw, controleerbaar ondernemershoofdstuk over '+x.focus+
    '. Bron: '+x.ref+'. Niet de afgekeurde tekst opnieuw formuleren. Geen verzonnen persoonlijke ervaringen, e-mails, omzet of klantresultaten. Leg een begrijpelijke les uit.',
   evidence:{...e,content_id:'ai-native-builder:'+date+':'+x.kind+':'+x.ref,
    source_kind:'verified_founder_builder+distinct_canonical_source',
    source_lineage:[...e.source_lineage,x.ref],
    personal_story_focus:x.focus,source_focus_ref:x.ref,
    source_focus_kind:x.kind,source_focus_context:x.source_context,
    source_family_verification:'OBSERVED_CONTEXT_NOT_PERSONAL_EXPERIENCE',
    provider_outcome_unproven:true}
  }));
}
