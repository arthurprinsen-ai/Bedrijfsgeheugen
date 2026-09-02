const arr=v=>Array.isArray(v)?v:[];
export function buildEuAiActAuditReport(passport={}){
 const a=passport.aiAct||{};
 const controls=arr(a.controls),findings=arr(a.findings),systems=arr(a.systems);
 const evidenceIndex=controls.flatMap(c=>arr(c.evidenceRefs).map(ref=>({ref,controlId:c.id,useCaseId:c.useCaseId,article:c.article})));
 return Object.freeze({
  kind:'eu-ai-act-audit-report',
  scope:{passportKind:passport.kind||'data-ai-passport',systems:systems.length,useCases:systems.map(s=>s.useCaseId)},
  baseline:a.regulatoryBaseline||null,
  conclusion:a.summary?.conclusion||'Scope niet bepaalbaar.',
  inventory:systems,
  controls,
  evidenceIndex,
  findings,
  accountability:systems.map(s=>({useCaseId:s.useCaseId,role:s.role,riskClass:s.riskClass})),
  transparency:controls.filter(c=>c.article==='Article 50'),
  snapshot:{generatedAt:passport.generatedAt||new Date().toISOString(),immutableCandidate:false},
  disclaimer:'Evidence-backed assurance report; geen juridisch certificaat en geen blanket EU AI Act complianceverklaring.'
 });
}
