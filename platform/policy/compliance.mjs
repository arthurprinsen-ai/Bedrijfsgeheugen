export function createComplianceLink({ law, requirement, policy, control, evidence = [] }) {
  for (const field of ['law','requirement','policy','control']) if (!arguments[0]?.[field]) throw new TypeError(`${field} is required`);
  return Object.freeze({ law, requirement, policy, control, evidence: Object.freeze([...evidence]) });
}

export function evidenceStatus(link, nowIso) {
  const now = new Date(nowIso).getTime();
  const items = link.evidence ?? [];
  if (!items.length) return Object.freeze({ status:'Missing', current:0, total:0 });
  const current = items.filter(item => !item.validUntil || new Date(item.validUntil).getTime() > now).length;
  return Object.freeze({ status: current === items.length ? 'Current' : (current ? 'Attention' : 'Expired'), current, total:items.length });
}

export function createPrivacyAuditEvent({ eventId, tenantId, actorId, action, purpose = null, dataClasses = [], providerModelId = null, policyIds = [], status, timestamp }) {
  for (const field of ['eventId','tenantId','actorId','action','status','timestamp']) if (!arguments[0]?.[field]) throw new TypeError(`${field} is required`);
  return Object.freeze({ eventId, tenantId, actorId, action, purpose, dataClasses:Object.freeze([...dataClasses]), providerModelId, policyIds:Object.freeze([...policyIds]), status, timestamp, rawPrompt:null, rawBusinessPayload:null });
}
