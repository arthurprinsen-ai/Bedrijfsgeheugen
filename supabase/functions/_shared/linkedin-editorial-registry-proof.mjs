import { LINKEDIN_EDITORIAL_PILLARS } from './linkedin-editorial-strategy.mjs';

// Selection lineage only, never causal impact or semantic proof that a model followed a brief.
const clean=v=>typeof v==='string'?v.trim():'';
const hex=/^[a-f0-9]{64}$/;
const owners={linkedin_personal:'canonical',linkedin_company:'bedrijfsgeheugen'};
async function digest(text){
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text));
 return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export async function verifiedEditorialRegistrySelection({proof,artifact,post,at=new Date()}={}){
 const channel=proof?.channel,ev=proof?.evidence||{},rb=ev.linkedin_readback||{},g=artifact?.generation_evidence||{},d=g.original_editorial_strategy||{};
 const observed=Date.parse(proof?.live_proven_at||''),published=Date.parse(proof?.published_at||''),now=+new Date(at);
 if(!Object.hasOwn(owners,channel)||proof.tenant_id!=='canonical'||proof.status!=='LIVE_PROVEN'
 ||!Number.isFinite(now)||!Number.isFinite(observed)||!Number.isFinite(published)||observed>now||published>observed
 ||post?.tenant_id!==owners[channel]||post?.channel_kind!==channel||post?.platform!=='linkedin'
 ||!/^urn:li:(share|ugcPost):[0-9]+$/.test(proof.external_id||'')||post.external_post_id!==proof.external_id
 ||ev.provider_truth_verified!==true||ev.independent_final_review_verified!==true||ev.provider_post_id!==proof.external_id
 ||rb.id!==proof.external_id||!clean(ev.author_urn)||rb.author!==ev.author_urn||clean(rb.lifecycleState).toUpperCase()!=='PUBLISHED'
 ||artifact?.channel!==channel||artifact?.run_date!==proof.publication_date||artifact?.status!=='published'
 ||g.final_copy_approved!==true||!clean(g.provider)||g.provider==='approved-frozen-source'
 ||d.contract!=='ORIGINAL_LINKEDIN_EDITORIAL_DECISION-v1'||d.channel!==channel||d.runDate!==proof.publication_date
 ||d.state!=='EDITORIAL_CANDIDATE'||d.receipt_state!=='DRAFT_CONTEXT_ONLY'||d.existingExperimentOwner!=='NO_NEW_EXPERIMENT'
 ||!clean(d.sourceId)||!hex.test(d.sourceRevision||'')||!hex.test(d.draft_body_sha256||'')
 ||!LINKEDIN_EDITORIAL_PILLARS[channel].includes(d.selection?.pillar)||d.selection?.format!=='tekstpost'
 ||d.learningApplied!==false||d.authorizesPublication!==false)return null;
 const body=clean(artifact.body);
 if(!body||body!==clean(rb.commentary))return null;
 const hash=await digest(body);
 if(hash!==d.draft_body_sha256||hash!==ev.final_text_hash||hash!==ev.reviewed_text_hash)return null;
 return {content_pillar:d.selection.pillar,content_hash:hash,format:'text',state:'SELECTED_PILLAR_EXACT_PUBLISHED_BODY',learningApplied:false,causalLiftProven:false};
}
