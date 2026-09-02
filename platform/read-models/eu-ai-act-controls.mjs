const arr=v=>Array.isArray(v)?v:[];
const clean=v=>String(v??'').trim();
const upper=v=>clean(v).toUpperCase();
const iso=d=>new Date(d).toISOString();

export const EU_AI_ACT_BASELINE=Object.freeze({
  id:'eu-ai-act-2026-09-02',
  asOf:'2026-09-02',
  regulation:'Regulation (EU) 2024/1689 as amended by Regulation (EU) 2026/1744',
  officialSource:'https://eur-lex.europa.eu/eli/reg/2024/1689',
  reviewRequiredAfter:'2026-12-02'
});

export const EU_AI_ACT_OBLIGATIONS=Object.freeze([
  {id:'art4-ai-literacy',article:'Article 4',title:'AI literacy',effectiveFrom:'2025-02-02',sourceUrl:'https://eur-lex.europa.eu/eli/reg/2024/1689',scope:'provider_deployer'},
  {id:'art5-prohibited-practices',article:'Article 5',title:'Prohibited AI practices screening',effectiveFrom:'2025-02-02',sourceUrl:'https://eur-lex.europa.eu/eli/reg/2024/1689',scope:'all'},
  {id:'art50-transparency',article:'Article 50',title:'Transparency for AI interaction and generated content',effectiveFrom:'2026-08-02',sourceUrl:'https://digital-strategy.ec.europa.eu/en/library/guidelines-transparency-obligations-providers-and-deployers-ai-systems',scope:'applicable_use_cases'},
  {id:'chapter3-annex3-high-risk',article:'Chapter III / Annex III',title:'High-risk AI system obligations',effectiveFrom:'2027-12-02',sourceUrl:'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32026R1744',scope:'high_risk_annex_iii'},
  {id:'chapter3-annex1-high-risk',article:'Chapter III / Annex I',title:'High-risk product-safety AI obligations',effectiveFrom:'2028-08-02',sourceUrl:'https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32026R1744',scope:'high_risk_annex_i'}
]);

function evidenceRefs(g){return [...arr(g.evidence_ids),...arr(g.approval_evidence_ids)].filter(Boolean);}
function isHighRisk(g){return upper(g.risk_class).includes('HIGH');}
function applies(ob,g){
  if(ob.id.startsWith('chapter3-')) return isHighRisk(g);
  if(ob.id==='art50-transparency') return g.transparency_required===true || /CHAT|CONTENT|ASSIST|COPILOT|GENERAT|INTERACT/i.test(`${g.name||''} ${g.purpose||''}`);
  return true;
}
function hasEvidence(ob,g,evidence){
  const refs=evidenceRefs(g);
  if(ob.id==='art4-ai-literacy') return evidence.aiLiteracy===true || refs.some(x=>/literacy|training|opleiding/i.test(String(x)));
  if(ob.id==='art5-prohibited-practices') return arr(g.prohibited_data_categories).length>0 && (g.approved===true || refs.length>0);
  if(ob.id==='art50-transparency') return g.transparency_required===true && (refs.length>0 || evidence.transparency===true);
  if(ob.id.startsWith('chapter3-')) return clean(g.human_oversight) && refs.length>0 && clean(g.risk_class);
  return false;
}
const findingId=(sys,control)=>`eu-ai-act:${clean(sys.tenant_id)||'canonical'}:${clean(sys.use_case_id)||'unknown'}:${control.id}`;

export function evaluateEuAiAct({governance=[],evidence={},asOf=new Date().toISOString()}={}){
  const date=iso(asOf); const systems=arr(governance).filter(g=>g?.approved===true&&upper(g.lifecycle_status)==='ACTIVE');
  const controls=[]; const findings=[];
  for(const system of systems){
    for(const ob of EU_AI_ACT_OBLIGATIONS){
      const applicable=applies(ob,system);
      let status='not_applicable';
      if(applicable){
        if(new Date(ob.effectiveFrom)>new Date(date)) status='future_readiness';
        else status=hasEvidence(ob,system,evidence)?'effective':'evidence_missing';
      }
      const control={...ob,useCaseId:system.use_case_id,name:system.name,role:clean(system.ai_act_role||system.role)||'not_determined',riskClass:clean(system.risk_class)||'not_determined',status,evidenceRefs:evidenceRefs(system)};
      controls.push(control);
      if(status==='evidence_missing'||status==='remediation_required'||status==='not_determined') findings.push({id:findingId(system,control),useCaseId:system.use_case_id,controlId:control.id,article:control.article,severity:'material',status:'open',title:`Evidence gap: ${control.title}`,owner:clean(system.owner)||'Bedrijfsgeheugen',remediation:`Leg aantoonbare evidence vast voor ${control.article} – ${control.title}.`});
    }
  }
  const current=controls.filter(c=>!['future_readiness','not_applicable'].includes(c.status));
  const effective=current.filter(c=>c.status==='effective').length;
  const blocked=current.some(c=>c.status!=='effective');
  const stale=new Date(date)>new Date(EU_AI_ACT_BASELINE.reviewRequiredAfter);
  const conclusion=systems.length===0?'Scope niet bepaalbaar: geen actieve AI-use-cases in het register.':stale?'Regelgevingsbaseline vereist herbeoordeling voordat een assurance-conclusie kan worden afgegeven.':blocked?'Materiële evidence-gaps aanwezig binnen de beoordeelde EU AI Act-scope.':'Geen materiële non-conformiteiten geïdentificeerd binnen de beoordeelde scope op basis van beschikbare evidence.';
  return Object.freeze({regulatoryBaseline:{...EU_AI_ACT_BASELINE,evaluatedAt:date,stale},systems:systems.map(g=>({useCaseId:g.use_case_id,name:g.name,provider:g.provider,model:g.model_id,riskClass:g.risk_class,role:clean(g.ai_act_role||g.role)||'not_determined'})),controls,findings,summary:{systems:systems.length,currentControls:current.length,effectiveControls:effective,futureReadiness:controls.filter(c=>c.status==='future_readiness').length,openFindings:findings.length,conclusion}});
}
