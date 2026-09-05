const ALLOWED=new Set(['title-meta','cta-copy-position','internal-link','content-gap','supporting-blog-opportunity','cannibalization-proposal','keyword-cluster-expansion','evidence-gap']);
const BLOCKED=/(testimonial|review|rating|klantresultaat|customer result|prijswijzig|price change|garantie|guarantee|juridisch|legal claim|certific|marktleider|market leader)/i;

export function validateOptimizationCandidate(candidate){
  const errors=[];const c=candidate||{};
  if(!ALLOWED.has(String(c.action||'')))errors.push('action is not allowlisted');
  if(!/^https:\/\/www\.bedrijfsgeheugen\.nl\//.test(String(c.canonical||'')))errors.push('canonical must be absolute bedrijfsgeheugen URL');
  for(const field of ['hypothesis','target_metric','rollback_condition'])if(!String(c[field]||'').trim())errors.push(`${field} is required`);
  if(!Array.isArray(c.evidence_refs)||!c.evidence_refs.length)errors.push('evidence_refs are required');
  const proposed=JSON.stringify(c.proposed_change||c.copy||'');
  if(BLOCKED.test(proposed)&&!c.explicit_fact_evidence)errors.push('blocked factual/commercial claim requires explicit evidence');
  if(c.auto_publish===true&&c.introduces_new_factual_claim===true)errors.push('new factual claims may not auto-publish');
  return errors;
}

export function mayAutoPublish(candidate){return validateOptimizationCandidate(candidate).length===0&&candidate?.auto_publish===true&&candidate?.introduces_new_factual_claim!==true&&candidate?.evidence_safe===true;}
