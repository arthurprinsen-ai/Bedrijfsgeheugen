// Customer-specific approvals are separate from public supplier claims.
// Evidence references must point to restricted records; never commit signed agreements.
export const customerClaimRequirements = Object.freeze({
  signed_dpa: 'signed_agreement',
  contract: 'signed_agreement',
  tenant_data_residency: 'contract_and_runtime',
  tenant_zdr: 'enabled_control',
  customer_cmk: 'enabled_control',
  private_networking_enabled: 'enabled_control'
});
const nonEmpty = v => typeof v === 'string' && v.trim().length > 0;
export function customerClaimStatus({tenantId,provider,modelId,claim,receipts=[],asOf=new Date()}={}) {
  const requirement=customerClaimRequirements[claim];
  if(!requirement||!nonEmpty(tenantId)||!nonEmpty(provider)||!nonEmpty(modelId))
    return {status:'UNVERIFIED',reason:'INVALID_SCOPE_OR_CLAIM'};
  const valid=(Array.isArray(receipts)?receipts:[]).filter(r=>r && r.claim===claim && r.tenant_id===tenantId &&
    r.provider===provider && r.model_id===modelId && r.scope==='customer_specific' &&
    r.review_status==='approved' && nonEmpty(r.approved_by) &&
    nonEmpty(r.evidence_reference) && nonEmpty(r.checked_on) &&
    nonEmpty(r.valid_until) && r.evidence_kind===requirement &&
    Number.isFinite(Date.parse(r.checked_on)) && Number.isFinite(Date.parse(r.valid_until)) &&
    Date.parse(r.checked_on)<=asOf.getTime() &&
    Date.parse(r.valid_until+( /^\d{4}-\d{2}-\d{2}$/.test(r.valid_until)?'T23:59:59.999Z':''))>=asOf.getTime() &&
    (claim!=='tenant_data_residency'||(nonEmpty(r.region) && r.runtime_region_confirmed===true)) &&
    (!['tenant_zdr','customer_cmk','private_networking_enabled'].includes(claim)||
      (r.control_enabled===true && nonEmpty(r.configuration_reference))));
  return valid.length?{status:'VERIFIED',evidence_reference:valid[0].evidence_reference}:
    {status:'UNVERIFIED',reason:'MISSING_APPROVED_TENANT_RECEIPT'};
}
export function customerReady(input) {
  const claims=Object.keys(customerClaimRequirements);
  const results=Object.fromEntries(claims.map(claim=>[claim,customerClaimStatus({...input,claim})]));
  return {ready:Object.values(results).every(x=>x.status==='VERIFIED'),claims:results};
}
