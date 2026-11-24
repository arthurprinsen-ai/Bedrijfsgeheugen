import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {appendFileSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {readCanonicalRows, evaluateOriginalOwnerHandoff} from './innovation-original-owner-readback.mjs';
import {trustedBrainReadConfig} from './planned-action-review-audit.mjs';
import {compileLearningEvaluationPlan, validateEvaluationContract} from './learning-canonicalization-gate.mjs';
import {sourceQualityNextAction} from './innovation-original-delivery-continuity.mjs';

export const CONTRACT='ORIGINAL_INNOVATION_BOUNDED_CODE_CANDIDATE_V1';
export const WORK_ORDER='artifacts/quality/original-innovation-code-workorder.json';
const REPO='arthurprinsen-ai/Bedrijfsgeheugen';
const SHA=/^[a-f0-9]{64}$/i;
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const fail=code=>{throw new Error('ORIGINAL_INNOVATION_CODE_'+code);};
const scopes=Object.freeze({
  'powerhouse-decision-cycle-evidence':[
    'platform/portal/powerhouse-existing-integration-read-model.mjs',
    'platform/system-map/canonical-system-map.mjs'
  ],
  'powerhouse-sales-cycle-execution-read-model':[
    'platform/portal/powerhouse-existing-integration-read-model.mjs',
    'portal-v2/control-plane-cockpit.js'
  ],
  'powerhouse-commercial-message-plan':[
    'supabase/functions/powerhouse-commercial-message-composer/index.ts'
  ]
});
// Exact historical fingerprints, not arbitrary candidate-provided paths.
// The analyst must establish a current reproducible defect before changing code.
const learningScopes=Object.freeze({
  'portal-visual-density-oversized-responsive-cascade-v1':Object.freeze({
    component:'portal-v2',
    paths:Object.freeze(['portal-v2/csrd-impact.css','portal-v2/csrd-mobile-saas.css','portal-v2/app.css']),
    action:'Reproduce current portal visual-density baseline using existing portal-visual-density contract and compare unchanged CSS with a minimal reversible challenger. Check all 24 route/viewport combinations and regression guards. If no current reproducible defect exists, do not modify code. Never claim production effect from local tests.'
  }),
  'approved-blog-stale-queue-existing-main-idempotency-v1':Object.freeze({
    component:'approved-blog-publisher',
    paths:Object.freeze(['scripts/publish_approved_blog_v2.py','scripts/brain/publish_approved_blog_v2_core.py']),
    action:'Analyze current approved-blog stale-queue selection and exact existing-artifact reconciliation with synthetic fixtures and existing regression tests. Compare unchanged behavior and a minimal reversible fix only if a current defect is reproduced. Do not run the live publisher, network requests or queue writes. No code change if current behavior is correct.'
  }),
  'delivery-recovery|pipeline|backend|approved-blog-core-boundary-oracle-v1':Object.freeze({
    component:'approved-blog-publisher',
    paths:Object.freeze(['scripts/publish_approved_blog_v2.py','scripts/brain/publish_approved_blog_v2_core.py']),
    action:'Analyze the current approved-blog wrapper/core behavior with existing offline regression fixtures, without modifying or weakening existing tests. Compare the current baseline with a minimal reversible challenger only for a reproduced implementation defect. Never invoke the live publisher, network or queue writes. If only a stale oracle or no defect is found, make no change and retain independent review.'
  })
});

// Versioned advisory method library. No method grants permission or adds a writer.
// Each family cites a reference for its approach; related techniques are a repertoire,
// not a claim that every method is mandated by or individually validated by that source.
export const INNOVATION_METHOD_FAMILIES=Object.freeze([
  {
    "id": "strategy",
    "methods": [
      "horizon scanning",
      "PESTEL",
      "scenario planning",
      "Delphi",
      "backcasting",
      "technology roadmapping",
      "SWOT",
      "Three Horizons"
    ],
    "source": "https://www.oecd.org/en/about/programmes/strategic-foresight.html",
    "evidence": "Dated signals, competing scenarios, falsifiable assumptions and decision triggers"
  },
  {
    "id": "customer",
    "methods": [
      "Double Diamond",
      "Design Thinking",
      "Jobs to Be Done",
      "customer discovery",
      "journey mapping",
      "service blueprint",
      "Kano",
      "usability testing"
    ],
    "source": "https://www.designcouncil.org.uk/resources/the-double-diamond/",
    "evidence": "Observed customer friction, alternatives, representative usability tasks and success rate"
  },
  {
    "id": "creativity",
    "methods": [
      "TRIZ",
      "contradiction matrix",
      "SCAMPER",
      "brainwriting",
      "morphological analysis",
      "analogical reasoning",
      "first principles"
    ],
    "source": "https://aitriz.org/pages/triz",
    "evidence": "Explicit contradiction, divergent concepts, feasibility and rejected alternatives"
  },
  {
    "id": "product",
    "methods": [
      "Lean Startup",
      "MVP",
      "prototyping",
      "QFD",
      "Stage-Gate",
      "TRL",
      "assumption mapping",
      "continuous discovery"
    ],
    "source": "https://www.stage-gate.com/about/stage-gate-innovation-performance-framework/discovery-to-launch-process/",
    "evidence": "Critical hypothesis, smallest reversible prototype, readiness and go/no-go thresholds"
  },
  {
    "id": "business",
    "methods": [
      "Business Model Canvas",
      "Value Proposition Canvas",
      "Blue Ocean",
      "unit economics",
      "pricing experiment",
      "competitive benchmarking",
      "open innovation"
    ],
    "source": "https://www.strategyzer.com/library/the-business-model-canvas",
    "evidence": "Customer evidence, value proposition, contribution margin and downside"
  },
  {
    "id": "portfolio",
    "methods": [
      "RICE",
      "ICE",
      "WSJF",
      "impact effort matrix",
      "multicriteria analysis",
      "real options",
      "portfolio balancing"
    ],
    "source": "https://committee.iso.org/sites/tc279/home/resources/standards-introduction.html",
    "evidence": "Comparable impact, confidence, effort, risk, dependencies and explicit assumptions"
  },
  {
    "id": "process",
    "methods": [
      "DMAIC",
      "PDCA",
      "Kaizen",
      "Lean",
      "Theory of Constraints",
      "process mining",
      "value stream mapping",
      "5 Whys",
      "Pareto",
      "Ishikawa",
      "Poka Yoke"
    ],
    "source": "https://asq.org/quality-resources/quality-tools",
    "evidence": "Observed bottleneck, baseline cycle time, error rate and repeatable comparison"
  },
  {
    "id": "experimentation",
    "methods": [
      "champion challenger",
      "A/B test",
      "holdout",
      "design of experiments",
      "statistical process control",
      "causal inference",
      "sensitivity analysis",
      "sequential testing"
    ],
    "source": "https://itl.nist.gov/div898/handbook/pmd/section3/pmd31.htm",
    "evidence": "Comparable population, metric, baseline, threshold, confounders and uncertainty"
  },
  {
    "id": "engineering",
    "methods": [
      "TDD",
      "contract testing",
      "Agile",
      "DevOps",
      "DORA",
      "performance profiling",
      "shadow testing",
      "canary",
      "fault isolation",
      "architecture tradeoff analysis"
    ],
    "source": "https://dora.dev/capabilities/continuous-delivery/",
    "evidence": "Reproducible failure, current source, regression, least-scope change and rollback"
  },
  {
    "id": "ai",
    "methods": [
      "model benchmark",
      "RAG evaluation",
      "agent trajectory evaluation",
      "adversarial testing",
      "human evaluation",
      "calibration",
      "ablation",
      "NIST AI RMF"
    ],
    "source": "https://airc.nist.gov/airmf-resources/playbook/",
    "evidence": "Representative eval cases, quality, latency, cost, safety, bias and provenance"
  },
  {
    "id": "risk",
    "methods": [
      "FMEA",
      "threat modeling",
      "privacy by design",
      "bow tie",
      "risk matrix",
      "pre mortem",
      "data minimization"
    ],
    "source": "https://airc.nist.gov/airmf-resources/airmf/5-sec-core/",
    "evidence": "Risk owner, controls, authorization, negative tests and residual risk"
  },
  {
    "id": "sustainability",
    "methods": [
      "life cycle assessment",
      "ecodesign",
      "circular design",
      "energy efficiency",
      "material flow analysis"
    ],
    "source": "https://www.iso.org/standard/37456.html",
    "evidence": "System boundary, functional unit, measured consumption and tradeoffs"
  },
  {
    "id": "organization",
    "methods": [
      "co creation",
      "innovation partnerships",
      "communities of practice",
      "change management",
      "knowledge transfer",
      "action learning"
    ],
    "source": "https://committee.iso.org/standard/68929.html",
    "evidence": "Named stakeholders, adoption baseline, validated capability and learning transfer"
  },
  {
    "id": "finance",
    "methods": [
      "FinOps",
      "total cost of ownership",
      "cost benefit analysis",
      "NPV",
      "sensitivity analysis",
      "cost per outcome",
      "capacity economics"
    ],
    "source": "https://www.finops.org/framework/",
    "evidence": "Real usage, total cost, budget and uncertainty; distinguish forecasts from realized value"
  }
].map(f=>Object.freeze({...f,methods:Object.freeze(f.methods)})));
const methodDomains=Object.freeze({
  'portal-v2':['customer','product','creativity'],
  'approved-blog-publisher':['process','experimentation','customer'],
  'powerhouse-decision-cycle-evidence':['process','strategy','ai'],
  'powerhouse-sales-cycle-execution-read-model':['business','process','experimentation'],
  'powerhouse-commercial-message-plan':['customer','business','experimentation']
});
export function originalInnovationMethodPlan(component){
  const domain=Object.hasOwn(methodDomains,component)?methodDomains[component]:[];
  const ids=[...new Set([...domain,'engineering','experimentation','risk','portfolio','finance'])];
  return Object.freeze({
    version:'innovation-methods-20261124-v1',
    families:ids.map(id=>INNOVATION_METHOD_FAMILIES.find(f=>f.id===id)),
    steps:['current source and baseline','incumbent plus at least one alternative','compare on same metric and constraints','choose smallest reversible winner or no-change','protected implementation and regression','independent production and effect readback','learning in original ONE BRAIN'],
    authority:'ADVISORY_ONLY_EXISTING_ORIGINAL_SCOPE',
    effect_verified:false
  });
}
// Enforce structured analysis metadata for an actual code candidate. This checks
// completeness and identity, not whether model-authored measurements are true.
// Existing executable regressions and independent production/effect guards remain mandatory.
export function validateOriginalInnovationMethodEvidence(workorder,evidence){
  const expected=originalInnovationMethodPlan(workorder.component_id);
  const validMethods=new Set(expected.families.flatMap(f=>f.methods));
  const present=x=>typeof x==='string'&&x.trim().length>=8;
  if(!evidence||evidence.version!==expected.version||
     evidence.candidate_id!==workorder.candidate_id||
     evidence.source_revision!==workorder.source_revision||
     evidence.source_sha256!==workorder.source_sha256||
     !Array.isArray(evidence.methods)||evidence.methods.length<2||
     new Set(evidence.methods).size!==evidence.methods.length||
     !evidence.methods.every(m=>validMethods.has(m))||
     !present(evidence.baseline_ref)||!present(evidence.metric)||
     !present(evidence.incumbent)||!present(evidence.challenger)||
     evidence.incumbent.trim()===evidence.challenger.trim()||
     !present(evidence.comparison_ref)||!present(evidence.decision_reason)||
     !present(evidence.rollback)||evidence.current_effect_verified!==false)
    fail('INNOVATION_METHOD_EVIDENCE_INCOMPLETE');
  return true;
}

const priority=['powerhouse-decision-cycle-evidence',
  'powerhouse-sales-cycle-execution-read-model','powerhouse-commercial-message-plan'];
const text=value=>typeof value==='string'?value.trim():'';
const obj=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);

// A historical parent PR is a lineage reference, not necessarily duplicate code.
// Before allowing the original writer to create an independent follow-up,
// require exact provider MERGED/main ancestry, an older date and disjoint paths.
export function isVerifiedMergedHistoricalParentPr({pr,parentPr,candidate,allowedSourcePaths}={}){
  const number=Number(parentPr),merged=Date.parse(pr?.mergedAt??''),
    created=Date.parse(candidate?.created_at??'');
  if(!Number.isInteger(number)||number<100||number>999999||
     pr?.number!==number||pr?.state!=='MERGED'||pr?.baseRefName!=='main'||
     !Number.isFinite(merged)||!Number.isFinite(created)||merged>created||
     !/^[a-f0-9]{40}$/i.test(pr?.mergeCommit?.oid??'')||
     !Array.isArray(pr?.files)||pr.files.length<1||!Array.isArray(allowedSourcePaths)||
     allowedSourcePaths.length<1)return false;
  if(typeof pr.body==='string'&&pr.body.split(/\r?\n/).some(line=>
     line.trim()==='Original-Candidate: '+candidate.candidate_id))return false;
  return pr.files.every(file=>typeof file?.path==='string'&&
     file.path.length>0&&!allowedSourcePaths.includes(file.path));
}
function verifiedHistoricalParentFor(number,candidate,allowedSourcePaths){
  const pr=JSON.parse(execFileSync('gh',
    ['pr','view',String(number),'--repo',REPO,
      '--json','number,state,mergedAt,mergeCommit,baseRefName,files,body'],
    {encoding:'utf8',timeout:25000,maxBuffer:4000000}));
  return isVerifiedMergedHistoricalParentPr({pr,parentPr:number,candidate,allowedSourcePaths});
}

export function selectOriginalCodeCandidate({snapshot,report,existingPrFor=()=>false,historicalParentFor=()=>false}={}){
  if(report?.contract!=='ORIGINAL_INNOVATION_AGENT_OWNER_READBACK_V1')fail('SOURCE_REPORT_REQUIRED');
  if(![snapshot?.candidates,snapshot?.obligations,snapshot?.intakes].every(Array.isArray))fail('SOURCE_ARRAYS_REQUIRED');
  if(snapshot.candidates.length!==report.counts?.candidates||
     snapshot.obligations.length!==report.counts?.obligations||
     snapshot.intakes.length!==report.counts?.intakes)fail('SOURCE_CARDINALITY_DRIFT');
  const obligations=new Map(snapshot.obligations.map(x=>[String(x.business_entity),x]));
  const intakes=new Map(snapshot.intakes.map(x=>[String(x.correlation_id),x]));
  if(obligations.size!==snapshot.obligations.length||intakes.size!==snapshot.intakes.length)fail('DUPLICATE_SOURCE');
  const candidates=[...snapshot.candidates].sort((a,b)=>
    priority.indexOf(a.component_id)-priority.indexOf(b.component_id)||
    String(a.created_at).localeCompare(String(b.created_at)));
  let eligible=0,existing=0,held=0;
  for(const c of candidates){
    const learning=c.proposed_action?.kind==='bounded_learning_followup';
    const learningKey=c.baseline?.quality_fingerprint;
    const learningScope=learning&&Object.hasOwn(learningScopes,learningKey)?learningScopes[learningKey]:null;
    const allowedPaths=learning?learningScope?.paths:scopes[c.component_id];
    if(!allowedPaths||learning&&learningScope.component!==c.component_id){held++;continue;}
    const obligation=obligations.get(c.candidate_id),op=intakes.get('innovation-delivery:'+c.candidate_id);
    if(!obligation||!op)fail('ORIGINAL_IDENTITY_MISSING');
    const owner='agent:agent-integration-engineer';
    const pre=op.evidence?.original_agent_pre_review;
    const decision=op.evidence?.original_owner_decision;
    if(!UUID.test(c.candidate_id)||!SHA.test(obligation.payload_sha256)||
       c.owner_agent!=='engineering'||c.status!=='candidate'||
       c.safety_class!=='review_required'||op.operation_type!=='INNOVATION_INTAKE'||
       op.status!=='PLANNED'||text(op.remote_ref)||
       op.capability_id!==owner||obligation.state!=='OPEN'||
       op.change_id!==c.source_key||obligation.change_id!==c.source_key||
       op.payload_sha256!==obligation.payload_sha256||
       op.correlation_id!=='innovation-delivery:'+c.candidate_id||
       op.idempotency_key!=='innovation-delivery:'+c.candidate_id+':'+obligation.payload_sha256.slice(0,16)||
       text(obligation.evidence?.source_revision)==='')fail('SOURCE_BINDING_INCOMPLETE');
    const action=learning?learningScope.action:text(c.proposed_action?.action);
    if(action.length<60||action.length>1800||!obj(c.rollback_plan)||
       !text(JSON.stringify(c.rollback_plan))){held++;continue;}
    if(!pre||pre.original_owner!==owner||
       pre.source_revision!==obligation.evidence.source_revision||
       pre.exact_source_action_digest!==digest(c.proposed_action)||
       pre.exact_source_rollback_digest!==digest(c.rollback_plan)||
       pre.consumer_ack_verified!==false||pre.external_side_effect!==false)fail('PRE_REVIEW_CONFLICT');
    if(!decision||decision.original_owner!==owner||
       decision.source_revision!==obligation.evidence.source_revision||
       decision.source_sha256!==obligation.payload_sha256||
       decision.original_action_digest!==digest(c.proposed_action)||
       decision.decision!==(learning?'BASELINE_AND_EVALUATION_DESIGN_REQUIRED':'CONCRETE_PROTECTED_CHANGE_PROPOSAL_DUE')||
       decision.actionable_work_package!==!learning||
       decision.production_mutation_authorized!==false||
       decision.consumer_ack_verified!==false)fail('ORIGINAL_OWNER_DECISION_CONFLICT');
    let qualityAction=null;
    if(learning){
      const receipt=op.evidence?.original_evidence_reconciliation;
      if(c.source_key!=='quality-learning-v1:'+learningKey||
         c.proposed_action.source_quality_fingerprint!==learningKey||
         c.proposed_action.human_review_required!==true||
         c.proposed_action.direct_production_mutation!==false||
         c.proposed_action.provider_dispatch_authorized!==false)fail('LEARNING_SOURCE_POLICY_CONFLICT');
      // Unverified or absent historical source cannot authorize a work order.
      if(!receipt||receipt.source_quality?.status!=='verified'||
         receipt.source_quality?.regression_ref_present!==true){held++;continue;}
      qualityAction=sourceQualityNextAction({candidate:c,obligation,operation:op,decision});
      if(!qualityAction||qualityAction.historical_source_status!=='verified')
        fail('LEARNING_SOURCE_RECEIPT_CONFLICT');
    }
    // Reconcile exact prior protected PRs and no-change review in the ORIGINAL operation.
    // A no-change review is NOT implementation evidence; it only prevents repeat model
    // spend against the same source revision while independent evaluation is due.
    const priorBuild=op.evidence?.original_code_candidate_pr;
    if(priorBuild){
      if(priorBuild.candidate_id!==c.candidate_id||
         priorBuild.source_revision!==obligation.evidence.source_revision||
         priorBuild.source_sha256!==obligation.payload_sha256)fail('ORIGINAL_PRIOR_CODE_PR_CONFLICT');
      held++;continue;
    }
    const priorNoChange=op.evidence?.original_code_nochange_review;
    if(priorNoChange){
      if(priorNoChange.candidate_id!==c.candidate_id||
         priorNoChange.source_revision!==obligation.evidence.source_revision||
         priorNoChange.source_sha256!==obligation.payload_sha256||
         priorNoChange.decision_fingerprint!==decision.fingerprint||
         priorNoChange.implementation_verified!==false||
         priorNoChange.consumer_ack_verified!==false)fail('ORIGINAL_NOCHANGE_REVIEW_CONFLICT');
      held++;continue;
    }
    // Original engineering implementations may predate this Codex candidate
    // generator. The protected native source evidence belongs to the SAME
    // candidate even when no original_code_candidate_pr receipt exists.
    // A historical parent is not authorization to reproduce an already
    // protected implementation. The existing continuity watchdog must
    // independently reconcile actual PR, deployment, source and effect.
    const implemented=op.evidence?.protected_implementation_source_evidence;
    if(implemented!==undefined){
      if(!obj(implemented)||
         implemented.contract!=='ORIGINAL_ENGINEERING_IMPLEMENTATION_EVIDENCE_V1'||
         implemented.candidate_id!==c.candidate_id||
         implemented.original_owner!==owner||
         implemented.source_revision!==obligation.evidence.source_revision||
         !/^https:\/\/github\.com\/arthurprinsen-ai\/Bedrijfsgeheugen\/pull\/[1-9][0-9]*$/.test(implemented.pr_url??'')||
         implemented.protected_release_verified!==true)
        fail('ORIGINAL_PRIOR_PROTECTED_IMPLEMENTATION_CONFLICT');
      held++;continue;
    }
    // A previously implemented source, or a duplicate candidate PR, must be reconciled, not rebuilt.
    if(/\bPR\s*#?\d{3,6}\b/i.test(action)){held++;continue;}
    // A linked old PR is never sufficient. The actual GitHub merged parent
    // must be older and disjoint, and the existing candidate dedupe still runs.
    const parent=c.proposed_action.parent_pr;
    if(parent!==undefined&&parent!==null){
      if(!/^[1-9][0-9]{2,5}$/.test(String(parent))||
         !historicalParentFor(Number(parent),c,allowedPaths)){
        held++;continue;
      }
    }
    eligible++;
    if(existingPrFor(c.candidate_id,obligation.payload_sha256,obligation.evidence.source_revision)){existing++;continue;}
    return Object.freeze({contract:CONTRACT,selected:true,
      candidate_id:c.candidate_id,component_id:c.component_id,
      owner,source_key:c.source_key,source_revision:obligation.evidence.source_revision,
      source_sha256:obligation.payload_sha256,
      operation_id:op.id,operation_version:op.version,
      correlation_id:op.correlation_id,idempotency_key:op.idempotency_key,
      decision_fingerprint:decision.fingerprint,
      proposed_action:action,rollback:JSON.stringify(c.rollback_plan).slice(0,1200),
      allowed_source_paths:allowedPaths,
      innovation_method_plan:originalInnovationMethodPlan(c.component_id),
      work_kind:learning?'SOURCE_BOUND_BASELINE_CHALLENGER':'CONCRETE_PROTECTED_CHANGE',
      source_quality_receipt_fingerprint:qualityAction?.receipt_fingerprint??null,
      current_effect_verified:false,
      protected_review_required:true,automatic_production_mutation:false,
      candidate_pr_only:true,consumer_ack_verified:false});
  }
  return Object.freeze({contract:CONTRACT,selected:false,eligible,existing,held,
    reason:'NO_NEW_SOURCE_BOUND_SAFE_CODE_CANDIDATE',terminal_success:false});
}
function git(args){
  return execFileSync('git',args,{encoding:'utf8',timeout:15000,maxBuffer:2000000}).trim();
}
export function isExactOriginalInnovationImplementationPr({pr,candidateId,sourceSha,sourceRevision}={}){
  if(!UUID.test(candidateId)||!SHA.test(sourceSha)||
     typeof sourceRevision!=='string'||!sourceRevision.trim()||
     typeof pr?.body!=='string')return false;
  // A recovery/doc PR can mention the UUID but is NOT an implementation receipt.
  if(typeof pr.headRefName!=='string'||
     !new RegExp('^writer/innovation-'+candidateId.slice(0,8)+'-[0-9]+$').test(pr.headRefName))return false;
  const lines=pr.body.split(/\r?\n/).map(line=>line.trim());
  return lines.includes('Candidate-Type: implementation')&&
    lines.includes('Original-Candidate: '+candidateId)&&
    lines.includes('Original-Source-SHA256: '+sourceSha)&&
    lines.includes('Original-Source-Revision: '+sourceRevision)&&
    lines.some(line=>line.startsWith('Original-Operation: '))&&
    lines.includes('Writer-Lease-Owner: agent:agent-integration-engineer');
}
function existingPrFor(id,sourceSha,sourceRevision){
  const data=JSON.parse(execFileSync('gh',
    ['pr','list','--repo',REPO,'--state','all','--search',id,
      '--limit','100','--json','number,body,headRefName'],
    {encoding:'utf8',timeout:25000,maxBuffer:4000000}));
  if(!Array.isArray(data))fail('GITHUB_PR_READBACK_INVALID');
  return data.some(pr=>isExactOriginalInnovationImplementationPr({
    pr,candidateId:id,sourceSha,sourceRevision
  }));
}
export function checkChangedPaths({workorder,changed,deleted=[]}={}){
  if(workorder?.contract!==CONTRACT||workorder.selected!==true||
     !Array.isArray(workorder.allowed_source_paths)||
     !Array.isArray(changed)||new Set(changed).size!==changed.length)fail('INVALID_DIFF');
  if(deleted.length)fail('DELETION_FORBIDDEN');
  const source=changed.filter(x=>workorder.allowed_source_paths.includes(x));
  const test=changed.filter(x=>/^tests\/brain-innovation-[a-z0-9-]+\.test\.mjs$/.test(x));
  const learn=changed.filter(x=>/^brain\/learning\/2026-11-\d{2}-innovation-[a-z0-9-]+\.json$/.test(x));
  const docs=changed.filter(x=>/^docs\/(changes|development-ledger-events)\/2026-11-\d{2}-innovation-[a-z0-9-]+\.md$/.test(x));
  const human=docs.filter(x=>x.startsWith('docs/changes/'));
  const ledger=docs.filter(x=>x.startsWith('docs/development-ledger-events/'));
  if(changed.length<5||changed.length>8||source.length<1||test.length<1||learn.length<1||
     human.length!==1||ledger.length!==1||
     source.length+test.length+learn.length+docs.length!==changed.length)fail('PATH_SCOPE_OR_EVIDENCE_MISSING');
  return {source,test,learn,docs,changed};
}
export function classifyOriginalCodeDiff({workorder,changed,deleted=[]}={}){
  if(workorder?.contract!==CONTRACT||workorder.selected!==true||
     !Array.isArray(changed)||!Array.isArray(deleted))fail('INVALID_DIFF');
  if(changed.length===0&&deleted.length===0){
    return Object.freeze({has_changes:false,status:'NO_CODE_CHANGE_INDEPENDENT_REVIEW_DUE',
      implementation_verified:false,consumer_ack_verified:false,terminal_success:false});
  }
  const checked=checkChangedPaths({workorder,changed,deleted});
  return Object.freeze({...checked,has_changes:true,status:'BOUNDED_CODE_CANDIDATE'});
}
function recordOutput(name,value){
  if(process.env.GITHUB_OUTPUT)appendFileSync(process.env.GITHUB_OUTPUT,name+'='+value+'\n');
}
async function main(){
  const mode=process.argv[2];
  if(mode==='--prepare'){
    const snapshot=await readCanonicalRows({config:trustedBrainReadConfig(process.env)});
    const report=evaluateOriginalOwnerHandoff(snapshot);
    const selected=selectOriginalCodeCandidate({snapshot,report,existingPrFor,historicalParentFor:verifiedHistoricalParentFor});
    mkdirSync('artifacts/quality',{recursive:true});
    writeFileSync(WORK_ORDER,JSON.stringify(selected,null,2)+'\n');
    recordOutput('selected',selected.selected?'true':'false');
    if(selected.selected)recordOutput('candidate_id',selected.candidate_id);
    process.stdout.write(JSON.stringify({contract:CONTRACT,selected:selected.selected,
      candidate_id:selected.candidate_id??null,reason:selected.reason??null,
      source_bound:true,production_authorized:false})+'\n');
    return;
  }
  if(mode==='--validate'){
    const selected=JSON.parse(readFileSync(WORK_ORDER,'utf8'));
    const tracked=git(['diff','HEAD','--name-only']).split('\n').filter(Boolean);
    const deleted=git(['diff','HEAD','--name-only','--diff-filter=D']).split('\n').filter(Boolean);
    const untracked=git(['ls-files','--others','--exclude-standard']).split('\n')
      .filter(x=>x&&!x.startsWith('artifacts/quality/'));
    const changed=[...new Set([...tracked,...untracked])].sort();
    const result=classifyOriginalCodeDiff({workorder:selected,changed,deleted});
    recordOutput('has_changes',result.has_changes?'true':'false');
    if(!result.has_changes){
      process.stdout.write(JSON.stringify({candidate_id:selected.candidate_id,
        result:result.status,implementation_verified:false,original_remains_planned:true})+'\n');
      return;
    }
    for(const path of result.learn){
      const lesson=JSON.parse(readFileSync(path,'utf8'));
      if(!lesson.compiler?.failure_class||!lesson.fingerprint||!lesson.root_cause)
        fail('LEARNING_ROOT_CAUSE_REQUIRED');
      validateOriginalInnovationMethodEvidence(selected,lesson.innovation_method_evidence);
      const plan=compileLearningEvaluationPlan(lesson);
      const modes=validateEvaluationContract(lesson,plan);
      for(const [mode,tests] of Object.entries(modes.tests_by_mode)){
        execFileSync('node',['--test',...tests],{stdio:'inherit',timeout:120000,
          env:{...process.env,POWERHOUSE_LEARNING_EVAL_MODE:mode.toUpperCase()}});
      }
    }
    for(const path of result.docs){
      const content=readFileSync(path,'utf8');
      if(content.trim().length<180||!content.includes(selected.candidate_id))
        fail('ORIGINAL_DOC_SOURCE_OR_CONTENT_MISSING');
    }
    git(['diff','--check']);
    for(const path of result.test)execFileSync('node',['--test',path],
      {stdio:'inherit',timeout:120000});
    process.stdout.write(JSON.stringify({validated:true,changed:result.changed,
      candidate_id:selected.candidate_id,protected_release_due:true})+'\n');
    return;
  }
  if(mode==='--paths'){
    const selected=JSON.parse(readFileSync(WORK_ORDER,'utf8'));
    const tracked=git(['diff','HEAD','--name-only']).split('\n').filter(Boolean);
    const untracked=git(['ls-files','--others','--exclude-standard']).split('\n')
      .filter(x=>x&&!x.startsWith('artifacts/quality/'));
    const changed=[...new Set([...tracked,...untracked])].sort();
    checkChangedPaths({workorder:selected,changed,
      deleted:git(['diff','HEAD','--name-only','--diff-filter=D']).split('\n').filter(Boolean)});
    process.stdout.write(changed.join('\n')+'\n');
    return;
  }
  fail('UNKNOWN_MODE');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])main().catch(e=>{
  process.stderr.write(String(e.message).slice(0,220)+'\n');process.exitCode=1;
});
