/** Only verified, fresh, same-tenant brand learnings may inform the next publication.
 * Evaluation metrics and candidates are NOT causal wins. */
const ALLOWED_METRICS=new Set(['comments','likes','shares','saves','clicks','qualified_leads','orders','revenue','comment_rate','like_rate','substantive_interaction_rate','click_rate','qualified_lead_rate']);
export function selectVerifiedBrandLearnings(rows, {now=new Date(),max=3}={}){
 if(!Array.isArray(rows))return [];
 const date=now instanceof Date?now:new Date(now);
 if(Number.isNaN(date.getTime()))throw new Error('BRAND_LEARNING_INVALID_CLOCK');
 const maxItems=Math.max(1,Math.min(5,Math.floor(Number(max)||3)));
 const unique=new Set(),eligible=[];
 for(const row of rows){
   if(!row||row.tenant_id!=='bedrijfsgeheugen'||row.status!=='PROVEN'||row.component_scope!=='social_components')continue;
   const id=String(row.learning_id||'');
   if(!id||unique.has(id))continue;
   const metric=String(row.effect_metric||'');
   const support=Number(row.sample_size),confidence=Number(row.confidence),effect=Number(row.effect_size);
   if(!ALLOWED_METRICS.has(metric)||!Number.isFinite(support)||support<5||
      !Number.isFinite(confidence)||confidence<0.75||confidence>1||
      !Number.isFinite(effect)||effect<=0)continue;
   const at=Date.parse(row.last_validated_at||'');
   const expiry=Date.parse(row.expires_or_review_at||'');
   if(!Number.isFinite(at)||at>date.getTime()||date.getTime()-at>30*86400000||
      !Number.isFinite(expiry)||expiry<=date.getTime())continue;
   if(!Array.isArray(row.evidence_refs)||row.evidence_refs.length===0)continue;
   const claim=String(row.claim||'').trim();
   if(!claim||claim.length>320)continue;
   unique.add(id);
   eligible.push({learning_id:id,component:String(row.fingerprint||'').slice(0,180),
     observed_pattern:claim,metric,comparison_sample_size:support,
     confidence:Number(confidence.toFixed(3)),
     evidence_refs:row.evidence_refs.filter(x=>typeof x==='string').slice(0,5),
     validated_at:new Date(at).toISOString(),status:'VERIFIED_TENANT_SCOPED_PATTERN_NOT_A_GUARANTEE'});
 }
 return eligible.sort((a,b)=>b.confidence-a.confidence||a.learning_id.localeCompare(b.learning_id)).slice(0,maxItems);
}
