const clean=value=>String(value??'').trim();
const uniqueSorted=values=>Object.freeze([...new Set((Array.isArray(values)?values:[]).map(clean).filter(Boolean))].sort());
const required=(value,name)=>{const v=clean(value);if(!v)throw new TypeError(`${name} is required`);return v};

export function createChangeEnvelope(input={}){
  const expectedEvidence=uniqueSorted(input.expectedEvidence);
  if(expectedEvidence.length===0)throw new TypeError('expected evidence is required');
  const envelope={
    changeId:required(input.changeId,'changeId'),
    owner:required(input.owner,'owner'),
    platform:required(input.platform,'platform').toLowerCase(),
    baseVersion:required(input.baseVersion,'baseVersion'),
    candidateVersion:required(input.candidateVersion,'candidateVersion'),
    changedResources:uniqueSorted(input.changedResources),
    contractKeys:uniqueSorted(input.contractKeys),
    riskClass:required(input.riskClass,'riskClass'),
    requiredGates:uniqueSorted(input.requiredGates),
    rollbackStrategy:required(input.rollbackStrategy,'rollbackStrategy'),
    hardBoundary:input.hardBoundary===true,
    expectedEvidence,
  };
  return Object.freeze(envelope);
}
