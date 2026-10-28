/** Feed existing, scoped outcome evidence into the next canonical generator.
 * A consumed context is not independent proof of a successful intervention. */
const METRICS=['revenue','orders','proposals','qualified_leads','meetings','leads','qualified_lead_rate','substantive_interaction_rate','clicks','click_rate','comment_rate'];
const CHANNELS=new Set(['blog','linkedin_personal','linkedin_company','instagram_company','email','reply_email','e-mail']);
const EMAIL=new Set(['email','reply_email','e-mail']);
const CONTRACT='POWERHOUSE-CONTENT-FEEDBACK-CONTEXT-v1';
function base(channel,tenantId,now){
 if(!CHANNELS.has(channel)||!['canonical','bedrijfsgeheugen'].includes(tenantId)||(EMAIL.has(channel)&&tenantId!=='canonical'))throw new Error('CONTENT_FEEDBACK_SCOPE_REJECTED');
 const clock=new Date(now);
 if(!Number.isFinite(clock.getTime()))throw new Error('CONTENT_FEEDBACK_CLOCK_INVALID');
 return {contract:CONTRACT,channel,tenant_id:tenantId,observed_at:clock.toISOString(),state:'INSUFFICIENT_VERIFIED_EVIDENCE',learning_ids:[],lessons:[],business_improvement_proven:false,authority:'CONTEXT_ONLY_EXISTING_EXECUTOR_AND_POLICY_GATES',truth_boundary:'Observed patterns are not causal gains, consent, delivery evidence or paid revenue.'};
}
export function selectContentFeedback({channel,tenantId,rows=[],now=new Date()}={}){
 const result=base(channel,tenantId,now),clock=Date.parse(result.observed_at),seen=new Set();
 for(const row of Array.isArray(rows)?rows:[]){
  if(row?.tenant_id!==tenantId||row.component_scope!==channel||row.status!=='PROVEN')continue;
  const id=String(row.learning_id||''),claim=String(row.claim||'').trim();
  const at=Date.parse(row.last_validated_at||''),expiry=Date.parse(row.expires_or_review_at||'');
  const confidence=Number(row.confidence),sample=Number(row.sample_size),effect=Number(row.effect_size);
  const refs=Array.isArray(row.evidence_refs)?row.evidence_refs.filter(x=>typeof x==='string'&&x.trim()):[];
  if(!id||seen.has(id)||!claim||claim.length>320||!METRICS.includes(row.effect_metric)||!refs.length||
   !Number.isFinite(at)||at>clock||clock-at>30*86400000||!Number.isFinite(expiry)||expiry<=clock||
   !Number.isFinite(confidence)||confidence<.75||confidence>1||!Number.isFinite(sample)||sample<5||
   !Number.isFinite(effect)||effect<=0)continue;
  seen.add(id);
  result.lessons.push({learning_id:id,claim,metric:row.effect_metric,sample_size:sample,confidence,effect_size:effect,evidence_refs:refs.slice(0,5)});
 }
 result.lessons.sort((a,b)=>METRICS.indexOf(a.metric)-METRICS.indexOf(b.metric)||b.confidence-a.confidence||a.learning_id.localeCompare(b.learning_id));
 result.lessons=result.lessons.slice(0,3);
 result.learning_ids=result.lessons.map(x=>x.learning_id);
 if(result.lessons.length)result.state='EVIDENCE_AVAILABLE';
 return result;
}
export async function loadContentFeedback(db,{channel,tenantId,playKey,now=new Date()}={}){
 const result=base(channel,tenantId,now);
 try{
  if(EMAIL.has(channel)){
   if(!playKey)return result;
   const {data,error}=await db.rpc('powerhouse_sales_play_learning_v1',{p_play_key:playKey,p_channel:'email'});
   if(error)throw new Error('PLAY_FEEDBACK_READ_FAILED');
   if(!data||data.play_key!==playKey||data.channel!=='email')throw new Error('PLAY_FEEDBACK_IDENTITY_MISMATCH');
   const sufficient=data.sample_sufficient===true&&Number(data.executed_actions)>=5&&Number(data.observed_outcomes)>=5;
   const policies=['PREFER_WHEN_CONTEXT_MATCHES','DEPRIORITIZE_AND_EXPERIMENT','NEUTRAL'];
   result.play_feedback={source_ref:'rpc:powerhouse_sales_play_learning_v1:'+playKey+':email',play_key:playKey,channel:'email',executed_actions:Number(data.executed_actions)||0,observed_outcomes:Number(data.observed_outcomes)||0,sample_sufficient:sufficient,policy:sufficient&&policies.includes(data.policy)?data.policy:'OBSERVE_ONLY'};
   result.state=sufficient?'EVIDENCE_AVAILABLE':'INSUFFICIENT_VERIFIED_EVIDENCE';
   return result;
  }
  const {data,error}=await db.from('revenue_learnings')
   .select('tenant_id,learning_id,component_scope,status,claim,effect_metric,effect_size,sample_size,confidence,last_validated_at,expires_or_review_at,evidence_refs')
   .eq('tenant_id',tenantId).eq('component_scope',channel).eq('status','PROVEN')
   .order('last_validated_at',{ascending:false}).limit(30);
  if(error)throw new Error('REVENUE_FEEDBACK_READ_FAILED');
  return selectContentFeedback({channel,tenantId,rows:data||[],now});
 }catch{
  return {...result,state:'SOURCE_UNAVAILABLE',error_class:'CONTENT_FEEDBACK_SOURCE_UNAVAILABLE'};
 }
}
export const CONTENT_FEEDBACK_GUIDE='Gebruik commercial_feedback uitsluitend als begrensde context voor deze volgende boodschap. Bij EVIDENCE_AVAILABLE mag hoogstens één relevante bevinding de opening, nuttige inhoud of CTA bijsturen, binnen alle bestaande redactie- en kwaliteitsregels. OBSERVE_ONLY, ontbrekende bron of onvoldoende steekproef is geen winnaar en geen reden om feiten of resultaten te verzinnen. Behoud de exacte bronverwijzingen in interne evidence; toon ze niet als technische tekst aan de lezer. Dit is geen bewijs van causaal effect, toestemming of gerealiseerde omzet.';
