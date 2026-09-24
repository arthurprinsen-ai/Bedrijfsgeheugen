const clamp=(v,min,max)=>Math.min(max,Math.max(min,Number(v)||0));

function freshnessScore(days=365){
  const d=Math.max(0,Number(days)||0);
  if(d<=1)return 100;
  if(d<=7)return 90;
  if(d<=30)return 70;
  if(d<=90)return 45;
  return 20;
}

function ownerFor(input){
  const c=String(input.component||'').toLowerCase();
  const s=String(input.source||'').toLowerCase();
  if(c.includes('seo')||s==='search')return '10';
  if(c.includes('website')||c.includes('frontend')||c.includes('hero')||c.includes('cta'))return '01';
  if(c.includes('cost'))return '14';
  if(c.includes('performance'))return '16';
  if(c.includes('security'))return '09';
  if(c.includes('market')||c.includes('positioning'))return '13';
  return '13';
}

function cleanString(value){
  const v=String(value??'').trim();
  return v||null;
}

function cleanStringArray(value){
  return Array.isArray(value)?value.map(cleanString).filter(Boolean):[];
}

export function commercialContext(input={}){
  const enabled=input.commercial_acquisition===true;
  const evidence_refs=cleanStringArray(input.evidence_refs);
  const trigger_type=cleanString(input.trigger_type);
  const problem_hypothesis=cleanString(input.problem_hypothesis);
  const decision_maker_role=cleanString(input.decision_maker_role);
  const recommended_next_action=cleanString(input.recommended_next_action);
  const partner_route=cleanString(input.partner_route);
  const buyer_stage=cleanString(input.buyer_stage);
  const recommended_content_angle=cleanString(input.recommended_content_angle);
  const observed_at=cleanString(input.observed_at);
  const confidence=clamp(input.confidence,0,1);
  const required=[
    ['trigger_type',trigger_type],
    ['problem_hypothesis',problem_hypothesis],
    ['decision_maker_role',decision_maker_role],
    ['recommended_next_action',recommended_next_action]
  ];
  const missing=required.filter(([,value])=>!value).map(([key])=>key);
  if(evidence_refs.length===0)missing.push('evidence_refs');
  if(confidence<0.6)missing.push('confidence>=0.6');
  const commercial_ready=enabled&&missing.length===0;
  return {
    commercial_acquisition:enabled,
    trigger_type,
    problem_hypothesis,
    economic_impact_hypothesis:cleanString(input.economic_impact_hypothesis),
    decision_maker_role,
    buyer_stage,
    recommended_next_action,
    recommended_content_angle,
    partner_route,
    observed_at,
    evidence_refs,
    commercial_ready,
    commercial_execution_class:commercial_ready?'trigger-led-next-action':'observe',
    do_not_contact_reason:enabled&&!commercial_ready?'insufficient-commercial-evidence:'+missing.join(','):cleanString(input.do_not_contact_reason)
  };
}

export function scoreOpportunity(input={}){
  const sourceQuality=clamp(input.source_quality,0,100);
  const corroboration=Math.min(5,Math.max(0,Number(input.corroboration_count)||0));
  const corroborationScore=corroboration*20;
  const freshness=freshnessScore(input.freshness_days);
  const evidence_score=Math.round(sourceQuality*0.5+corroborationScore*0.3+freshness*0.2);
  const novelty_score=clamp(input.novelty,0,100);
  const business_impact_score=clamp(input.business_impact,0,100);
  const confidence=clamp(input.confidence,0,1);
  const effort=Math.max(1,Number(input.effort)||3);
  const demandBoost=input.search_demand_confirmed?10:0;
  const priority=((evidence_score*(business_impact_score+demandBoost)*confidence)/effort);
  const qualified=evidence_score>=65 && business_impact_score>=60 && confidence>=0.6 && Boolean(input.metric);
  const commercial=commercialContext({...input,confidence});
  return {
    ...input,
    ...commercial,
    evidence_score,
    novelty_score,
    business_impact_score,
    confidence,
    priority,
    qualified,
    owner_agent:ownerFor(input),
    execution_class: qualified ? 'preview-experiment' : 'observe'
  };
}

export function rankOpportunities(items=[]){
  return [...items].sort((a,b)=>{
    if(Boolean(a.security_critical)!==Boolean(b.security_critical)) return a.security_critical?-1:1;
    return (Number(b.priority)||0)-(Number(a.priority)||0);
  });
}
