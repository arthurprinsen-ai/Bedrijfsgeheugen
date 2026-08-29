export const DOMAIN_OBJECT_TYPES = Object.freeze({
  CORE: ['Company', 'BusinessUnit', 'Team', 'Person', 'Role'],
  STRATEGY: ['Strategy', 'Goal', 'KPI', 'Assumption', 'Constraint', 'Decision'],
  EXECUTION: ['Initiative', 'Project', 'RoadmapItem', 'Action', 'Change', 'Impact', 'Learning'],
  OPERATIONS: ['Process', 'ProcessStep', 'Capability', 'KnowledgeItem', 'Document', 'System', 'DataDomain', 'Dataset', 'Integration', 'Vendor', 'Contract'],
  COMMERCIAL: ['Market', 'Segment', 'Need', 'Proposition', 'Product', 'Service', 'Offering', 'PricePlan', 'Customer', 'Lead', 'Opportunity', 'Campaign', 'Channel', 'Content', 'Experiment', 'Revenue'],
  GOVERNANCE: ['Policy', 'Permission', 'Requirement', 'Control', 'Evidence', 'AIUseCase', 'Agent', 'AgentWork', 'Provider', 'Model', 'DataClassification', 'AccessReview'],
  MODELS: ['BusinessModel', 'ModelVersion', 'FieldDefinition', 'Response', 'AIReview'],
});

const flat = Object.values(DOMAIN_OBJECT_TYPES).flat();
export const ALL_DOMAIN_OBJECT_TYPES = Object.freeze([...flat]);
const allowed = new Set(flat);

export function assertDomainObjectType(type) {
  if (typeof type !== 'string' || !allowed.has(type)) {
    throw new TypeError(`unsupported canonical domain object type: ${String(type)}`);
  }
  return true;
}

export function domainForObjectType(type) {
  assertDomainObjectType(type);
  for (const [domain, types] of Object.entries(DOMAIN_OBJECT_TYPES)) {
    if (types.includes(type)) return domain;
  }
  throw new TypeError(`domain not found for object type: ${type}`);
}
