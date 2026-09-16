export function buildCoverageReport({surfaces=[],evidence=[]}={}) {
  const byId=new Map(evidence.map(e=>[String(e.surface_id),e])); const covered=[],gaps=[],unknown=[];
  for(const surface of surfaces){const item={...surface};const ev=byId.get(String(surface.id));if(ev?.status==='proven')covered.push({...item,evidence:ev});else if(surface.required)gaps.push({...item,evidence_state:ev?.status||'NOT_REGISTERED'});else unknown.push({...item,evidence_state:ev?.status||'NOT_REGISTERED'});}
  return Object.freeze({fingerprint:'powerhouse-quality-coverage-report-v1',status:gaps.length?'BLOCKED':'GREEN',covered,gaps,unknown,obligations:gaps.map(g=>({kind:'quality_coverage_gap',surface_id:g.id,authority:g.authority??null,evidence_state:g.evidence_state,learning_authority:'BRAIN-CLOSED-LOOP-v1'}))});
}
