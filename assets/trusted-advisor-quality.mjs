// Customer-facing advisory integrity guard. Pure and deterministic; never approves publication.
// Internal incidents belong in the authenticated control plane, not marketing copy.
export const TRUSTED_ADVISOR_CONTRACT='one-brain-trusted-advisor-external-quality-v1';
const str=v=>typeof v==='string'?v.trim():'';
const unique=items=>Object.freeze([...new Set(items)]);
const hasRefs=refs=>Array.isArray(refs)&&refs.some(x=>str(typeof x==='string'?x:x?.url||x?.id||x?.source).length>0);

/**
 * High-confidence copy defects only. The original editor must still verify facts,
 * permission, tone, accessibility, source quality, and real provider delivery.
 */
export function assessTrustedAdvisorCopy(value,{channel='website',sourceRefs=[],claimVerified=false}={}){
 const text=str(value),errors=[],warnings=[];
 if(!text)return Object.freeze({contract:TRUSTED_ADVISOR_CONTRACT,channel,status:'BLOCKED',publishEligible:false,
   humanApprovalRequired:true,errors:Object.freeze(['CUSTOMER_COPY_EMPTY']),warnings:Object.freeze([]),claimEvidence:'UNKNOWN'});
 const add=(out,cond,code)=>{if(cond)out.push(code)};
 add(errors,/(?:\[\s*(?:TODO|PLACEHOLDER|INVULLEN)\s*\]|\{\{\s*[^}]{1,80}\s*\}\}|voordat u publiceert|publicatiestap\s*\(|redactienotitie\s*:|dit is een concept(?:tekst)?)/i.test(text),'PUBLIC_DRAFT_INSTRUCTION_LEAK');
 add(errors,/\b(?:PR\s*#\d{3,}|GitHub Actions|CodeQL\s+(?:rood|groen|failed|passed)|BRAIN\s*(?:run|tests?)\s*#?\d+|(?:CI|teststraat)\s+(?:faalt|groen|rood|geslaagd)|(?:release|deploy|merge|build)\s+(?:mislukt|geslaagd|geblokkeerd)|(?:commit|SHA)\s+[a-f0-9]{7,40})\b/i.test(text),
   'PUBLIC_INTERNAL_RELEASE_LEAK');
 add(errors,/\b(?:service[_-]?role[_-]?key|supabase_service_role_key|bearer\s+[a-z0-9._~-]{20,}|sk-[a-z0-9]{20,})\b/i.test(text),'PUBLIC_SECRET_LEAK');
 add(errors,/\b(?:revolutionair|game[ -]?changer|100%\s+gegarandeerd|verdubbel(?:t|en)\s+gegarandeerd|gegarandeerde?\s+(?:omzet|winst|groei|resultaten?))\b/i.test(text),
   'UNPROFESSIONAL_HYPE_OR_GUARANTEE');
 const measurableClaim=/(?:\b\d+(?:[.,]\d+)?\s*%\s*(?:meer|minder|groei|omzet|winst|bespar(?:ing|ingen)|conversie|kosten|tijd)\b|\b(?:omzet|winst|conversie)\s+(?:steeg|groeide)\s+met\s+\d)/i.test(text);
 add(errors,measurableClaim&&!hasRefs(sourceRefs),'OUTCOME_CLAIM_SOURCE_MISSING');
 add(warnings,measurableClaim&&hasRefs(sourceRefs)&&claimVerified!==true,'OUTCOME_CLAIM_INDEPENDENT_PROOF_DUE');
 add(warnings,/^(?:klik hier|click here|ontdek meer|meer informatie)[.!]?$/i.test(text),'GENERIC_CTA_REVIEW');
 const blocking=unique(errors),advisory=unique(warnings);
 return Object.freeze({
  contract:TRUSTED_ADVISOR_CONTRACT,channel,
  status:blocking.length?'BLOCKED':advisory.length?'REVIEW_WITH_WARNINGS':'READY_FOR_EDITOR_REVIEW',
  publishEligible:blocking.length===0,humanApprovalRequired:true,
  errors:blocking,warnings:advisory,
  claimEvidence:measurableClaim?(claimVerified===true?'DECLARED_VERIFIED_REQUIRES_EDITOR_CHECK':hasRefs(sourceRefs)?'SOURCE_PRESENT_INDEPENDENT_PROOF_DUE':'SOURCE_MISSING'):'NOT_APPLICABLE',
  providerReadbackVerified:false,customerTrustUpliftVerified:false
 });
}
