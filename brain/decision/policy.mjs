import {scoreCandidate} from './score.mjs';
const laneFor=t=>/SALES|COMMERCIAL|LEAD|CRM|DM/.test(t)?'COMMERCIAL':/PRODUCT|WEBSITE|UX|CRO/.test(t)?'PRODUCT':/CONTENT|SEO|VIDEO|CREATIVE|DEMAND/.test(t)?'CONTENT_DEMAND':/COST|PERFORMANCE|OPTIM/.test(t)?'IMPROVEMENT':/RESEARCH|EXPLORE/.test(t)?'EXPLORATION':'GROWTH';
export function decide(c){
  if(c.hard_boundary) return {decision:'ESCALATE_HARD_BOUNDARY',lane:'INCIDENT',score:null,reasons:['hard_boundary'],blocked_by:'HARD_BOUNDARY'};
  if(c.security_incident) return {decision:'FIX',lane:'INCIDENT',score:Infinity,reasons:['security_interrupt'],blocked_by:null};
  if(c.production_red) return {decision:'ROLLBACK',lane:'INCIDENT',score:Infinity,reasons:['production_red'],blocked_by:null};
  if(c.data_integrity_red) return {decision:'FIX',lane:'INCIDENT',score:Infinity,reasons:['data_integrity'],blocked_by:null};
  if(c.contact_pressure_ok===false) return {decision:'PAUSE',lane:'COMMERCIAL',score:0,reasons:['contact_pressure'],blocked_by:'CONTACT_PRESSURE'};
  if(c.budget_ok===false) return {decision:'PAUSE',lane:laneFor(c.type||''),score:0,reasons:['budget'],blocked_by:'BUDGET'};
  if((c.evidence_freshness??1)<.4) return {decision:'WATCH',lane:laneFor(c.type||''),score:0,reasons:['stale_evidence'],blocked_by:null};
  if((c.evidence_quality??0)<.5||(c.confidence??0)<.5) return {decision:'RESEARCH',lane:'EXPLORATION',score:0,reasons:['insufficient_evidence'],blocked_by:null};
  const score=scoreCandidate(c), lane=laneFor(c.type||'');
  if(score<.5) return {decision:'PAUSE',lane,score,reasons:['negative_opportunity_cost'],blocked_by:null};
  const type=String(c.type||'');
  const decision=/CONTENT|VIDEO|CREATIVE/.test(type)?'CREATE_CONTENT':/PRODUCT|WEBSITE|UX/.test(type)?'BUILD':/COST|PERFORMANCE|OPTIM/.test(type)?'OPTIMIZE':'TEST';
  return {decision,lane,score,reasons:['positive_expected_utility'],blocked_by:null};
}
