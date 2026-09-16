export function buildCoverageReport({surfaces=[],evidence=[]}={}) {
  const byId=new Map(evidence.map(e=>[String(e.surface_id),e]));
  const covered=[],gaps=[],unknown=[];
  for (const surface of surfaces) {
    const item={...surface}; const ev=byId.get(String(surface.id));
    if (ev?.status==='proven') covered.push({...item,evidence:ev});
    else if (surface.required) gaps.push({...item,evidence_state:ev?.status||'NOT_REGISTERED'});
    else unknown.push({...item,evidence_state:ev?.status||'NOT_REGISTERED'});
  }
  return Object.freeze({status:gaps.length?'BLOCKED':'GREEN',covered,gaps,unknown});
}
