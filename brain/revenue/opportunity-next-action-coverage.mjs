/**
 * Canonical opportunity follow-up coverage inside the EXISTING Growth Intelligence daily run.
 *
 * This module is a pure, bounded planner: no messaging, no provider calls, no scheduler,
 * no inferred revenue, no new CRM, and no assumption that LinkedIn likes = buying intent.
 * The caller must durably persist obligations and guarded opportunity-date updates.
 */
import { createHash } from 'node:crypto';

const txt=value=>String(value??'').trim();
const millis=value=>{const time=Date.parse(value||'');return Number.isFinite(time)?time:null;};
const HOUR=3_600_000;
const classifications=Object.freeze({
  ORDER_OBSERVED:0,PROPOSAL_FOLLOW_UP:1,PROPOSAL_CANDIDATE:2,
  DISCOVERY_CANDIDATE:3,RESEARCH_REQUIRED:4,NO_CONTACT:5
});
const delays=Object.freeze({
  ORDER_OBSERVED:4,PROPOSAL_FOLLOW_UP:4,PROPOSAL_CANDIDATE:8,
  DISCOVERY_CANDIDATE:24,RESEARCH_REQUIRED:72,NO_CONTACT:168
});
const stableId=key=>'commercial-followup:'+createHash('sha256').update(key).digest('hex').slice(0,28);

export function planOpportunityFollowups({
  opportunities=[],assessments=[],now=new Date().toISOString(),limit=24,highPriorityLimit=8
}={}){
  const at=millis(now);
  if(at===null)throw new TypeError('FOLLOWUP_VALID_TIME_REQUIRED');
  if(!Number.isInteger(limit)||limit<1||limit>48)throw new RangeError('FOLLOWUP_BOUNDED_LIMIT_REQUIRED');
  if(!Number.isInteger(highPriorityLimit)||highPriorityLimit<0||highPriorityLimit>limit)
    throw new RangeError('FOLLOWUP_PRIORITY_BUDGET_INVALID');
  const byKey=new Map((Array.isArray(assessments)?assessments:[])
    .filter(x=>txt(x?.opportunityKey)).map(x=>[txt(x.opportunityKey),x]));
  const seen=new Set(),due=[],future=[];
  let nullDates=0,overdueDates=0,open=0;
  for(const source of Array.isArray(opportunities)?opportunities:[]){
    if(txt(source?.status)!=='open'||!txt(source?.opportunity_key))continue;
    const key=txt(source.opportunity_key);
    if(seen.has(key))continue;
    seen.add(key);open++;
    const dueTime=millis(source.next_action_at);
    if(dueTime!==null&&dueTime>at){future.push(key);continue;}
    if(dueTime===null)nullDates++;else overdueDates++;
    const assessment=byKey.get(key);
    if(!assessment)continue; // Never generate a task without canonical commercial qualification.
    const classification=txt(assessment.classification);
    if(!(classification in classifications))continue;
    due.push({
      key,source,assessment,classification,dueTime,
      oldest:millis(source.last_action_at)??millis(source.created_at)??0
    });
  }
  // Bound immediate demand so low-intent research is never starved by high-ranked repeats.
  const ranked=(a,b)=>classifications[a.classification]-classifications[b.classification]||
    (a.dueTime??0)-(b.dueTime??0)||a.oldest-b.oldest||a.key.localeCompare(b.key);
  const urgent=due.filter(x=>classifications[x.classification]<4).sort(ranked);
  const backlog=due.filter(x=>classifications[x.classification]>=4)
    .sort((a,b)=>(a.dueTime??0)-(b.dueTime??0)||a.oldest-b.oldest||a.key.localeCompare(b.key));
  const selected=[...urgent.slice(0,highPriorityLimit),
    ...backlog.slice(0,Math.max(0,limit-Math.min(urgent.length,highPriorityLimit)))];
  // If few research cases remain, fill idle budget from other evidence-backed candidates.
  if(selected.length<limit)selected.push(...urgent.slice(highPriorityLimit,highPriorityLimit+limit-selected.length));
  const actions=selected.map(x=>{
    const dueAt=new Date(at+(delays[x.classification]||72)*HOUR).toISOString();
    const action=txt(x.assessment.nextAction)||'VERIFY_NEED_IMPACT_AND_URGENCY';
    const missing=Array.isArray(x.assessment.missingEvidence)?x.assessment.missingEvidence:[];
    return Object.freeze({
      opportunityKey:x.key,classification:x.classification,action,dueAt,
      obligation:{
        tenant_id:'canonical',
        obligation_id:stableId(x.key),
        type:'COMMERCIAL_NEXT_ACTION_REVIEW',
        content_id:'opportunity:'+x.key,
        status:'OPEN',
        due_at:dueAt,
        payload:{
          contract:'opportunity-next-action-coverage-v1',
          opportunity_key:x.key,
          next_best_action:action,
          classification:x.classification,
          missing_evidence:missing,
          source_evidence_refs:Array.isArray(x.assessment.evidenceRefs)?x.assessment.evidenceRefs:[],
          execution_state:'PLANNED_NOT_EXECUTED',
          outreach_authorized:false,
          owner:'existing-growth-intelligence-heartbeat',
          contact_policy:x.classification==='NO_CONTACT'?'SUPPRESSION_NO_EXTERNAL_CONTACT':'VERIFY_BEFORE_OUTREACH',
          diagnosis:x.dueTime===null?'NO_NEXT_ACTION_DATE':'NEXT_ACTION_EXPIRED',
          followup_due_at:dueAt
        },
        updated_at:new Date(at).toISOString()
      }
    });
  });
  return Object.freeze({
    contract:'opportunity-next-action-coverage-v1',open,
    withoutNextActionDate:nullDates,overdue:overdueDates,
    alreadyScheduled:future.length,uncovered:due.length,
    planned:actions.length,remainingDue:Math.max(0,due.length-actions.length),
    actions:Object.freeze(actions),
    schedulingIsNotExecution:true,
    revenueVerifiedByPlanner:false
  });
}
