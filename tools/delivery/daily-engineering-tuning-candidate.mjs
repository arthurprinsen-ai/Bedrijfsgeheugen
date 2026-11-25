import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const SHA40=/^[a-f0-9]{40}$/i;
const REQ_SAFETY=[
  'required_release_gate','security_gate','production_readback',
  'protected_merge','exact_sha_identity','autonomous_gate_weakening_forbidden'
];
const TUNING_KEYS=[
  'max_parallel_packages','candidate_batch_window_seconds',
  'fast_path_target_seconds','speculative_execution_threshold'
];
const sha=(value)=>String(value??'').trim().toLowerCase();

export function buildDailyEngineeringTuningCandidate({
  runId,baseSha,previous={},proposed={},observation={},date='2026-10-08'
}={}){
  if(!/^\d{1,20}$/.test(String(runId??'')))throw new Error('RUN_ID_INVALID');
  if(!SHA40.test(sha(baseSha)))throw new Error('BASE_SHA_INVALID');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('DATE_INVALID');
  for(const key of REQ_SAFETY){
    if(proposed?.safety?.[key]!==true)throw new Error('SAFETY_WEAKENING_FORBIDDEN:'+key);
  }
  const priorBudget=Number(previous?.ci?.direct_pr_workflow_budget ?? Number.MAX_SAFE_INTEGER);
  const nextBudget=Number(proposed?.ci?.direct_pr_workflow_budget);
  if(!Number.isFinite(nextBudget)||nextBudget<2||nextBudget>priorBudget)
    throw new Error('DIRECT_PR_BUDGET_REGRESSION');
  if(proposed?.ci?.direct_pr_workflow_target!==2 ||
    proposed?.ci?.required_queue_p95_slo_seconds!==30 ||
    proposed?.ci?.required_total_p95_slo_seconds!==120 ||
    proposed?.ci?.max_pr_workflows_per_head!==5)
    throw new Error('CANONICAL_CI_GATES_DRIFT');
  if(JSON.stringify(previous)===JSON.stringify(proposed))throw new Error('NO_TUNING_DIFF');
  const slug=`${date}-engineering-tuning-${runId}`;
  const obligationId=`powerhouse-daily-engineering-tuning-${runId}`;
  const paths=[
    'config/powerhouse-engineering-tuning.json',
    `brain/learning/${slug}.json`,
    `docs/changes/${slug}.md`,
    `docs/development-ledger-events/${slug}.md`
  ];
  const changes=TUNING_KEYS.filter(key=>proposed[key]!==previous[key])
    .map(key=>({parameter:key,previous:previous[key]??null,proposed:proposed[key]??null}));
  const learning={
    fingerprint:`powerhouse|engineering|daily-tuning|${runId}`,
    obligationId,status:'CANDIDATE_NOT_PRODUCTION_VERIFIED',
    root_cause:'Daily CI tuning proposals need a protected delivery contract, mandatory closure records and nonduplicating candidate retirement; a stale invalid candidate previously blocked measured tuning.',
    prevention:[
      'One title and canonical integration writer for each active tuning obligation',
      'Reject missing delivery metadata; retire only proven stale bot-owned invalid PRs',
      'Preserve required CI, security, exact SHA, CodeQL, protected merge and production evidence',
      'Keep observational performance measurement and bounded reversible tuning'
    ],
    compiler:{failure_class:'CI',scope:'GITHUB',machine_enforceable:true,repeat_count:1,security_sensitive:false},
    evaluation:{historical_replay:['tests/brain-engineering-tuning-candidate.test.mjs']},
    evidence:{
      github_run_id:String(runId),base_sha:sha(baseSha),
      observed_at:observation.observed_at??null,
      signal_snapshot:observation.signals??{},
      optimizer_decisions:observation.decisions??[],
      parameter_changes:changes,
      required_status:'PENDING_PROTECTED_CHECKS',
      production_readback:'PENDING',
      realized_business_value:'NOT_MEASURED'
    }
  };
  const textChanges=changes.length?changes.map(x=>`- \`${x.parameter}\`: ${JSON.stringify(x.previous)} → ${JSON.stringify(x.proposed)}`).join('\n')
    : '- Policy/guardrail fields changed without a tuning-knob adjustment';
  const docs=`# Protected daily engineering tuning — ${date}
  
Obligation-ID: \`${obligationId}\`.
Baseline main SHA: \`${sha(baseSha)}\`.
Github Actions run: \`${runId}\`.

## Existing-state-first rationale
Reuse the existing POWERHOUSE CI Intelligence and Autonomous Engineering Optimizer.
No parallel Brain, database, scheduler, agent authority or external commercial dispatch.

## Proposed bounded adjustment
${textChanges}

This is only a candidate. It is not a verified speed, cost or revenue improvement.
The exact-head Required/CodeQL, protected merge and relevant runtime readback remain mandatory.
The observational self-tuning outcome and rollback state are stored in the existing canonical tuning configuration.

## Safety and reversal
Required release gate, security gate, exact SHA, protected promotion and production proof are immutable.
The tuning experiment tracks prior knobs and must reverse observed regression through protected delivery.
Never interpret a skipped or failed Required run as a successful faster deployment.
`;
  const ledger=`# Engineering tuning ledger — ${slug}
  
- Obligation: ${obligationId}
- Origin: existing scheduled GitHub Actions run ${runId}
- Main baseline: ${sha(baseSha)}
- Canonical candidate: config/powerhouse-engineering-tuning.json
- Historical failure: nonadmissible stale daily tuning PR blocked future optimizer proposals
- Proposed changes: ${JSON.stringify(changes)}
- Measured signals: ${JSON.stringify(observation.signals??{})}
- Proof: not merged, not deployed and not performance-verified at candidate creation
- Recovery: keep protected checks, preserve old knobs and observational rollback evidence
- Unsolicited outbound / provider mutation: none
`;
  const body=[
    `Obligation-ID: ${obligationId}`,
    'Delivery-Lane: automation','Candidate-Type: implementation',
    `Base-SHA: ${sha(baseSha)}`,
    'Supersedes: none',
    `Change-Scope: ${paths.join(', ')}`,
    `Scope-Budget: ${paths.length}`,
    '',
    'Bounded, evidence-led tuning via ONE BRAIN. The Brain learning record,',
    'append-only ledger and human documentation are part of this same candidate.',
    'No weakening of Required, CodeQL, exact SHA, protected merge or production readback.',
    'Do not treat this protected PR as realized runtime/business improvement.'
  ].join('\n');
  return Object.freeze({slug,obligationId,paths,body,artifacts:Object.freeze({
    [paths[1]]:JSON.stringify(learning,null,2)+'\n',
    [paths[2]]:docs,
    [paths[3]]:ledger
  })});
}

async function writeCandidateFromExistingArtifacts(runId,baseSha){
  const previous=JSON.parse(await readFile('config/powerhouse-engineering-tuning.json','utf8'));
  const proposed=JSON.parse(await readFile('artifacts/engineering-optimizer/proposed-tuning.json','utf8'));
  const observation=JSON.parse(await readFile('artifacts/engineering-optimizer/latest.json','utf8'));
  const date=new Date().toISOString().slice(0,10);
  const built=buildDailyEngineeringTuningCandidate({runId,baseSha,previous,proposed,observation,date});
  for(const [path,value] of Object.entries(built.artifacts)){
    await mkdir(path.slice(0,path.lastIndexOf('/')),{recursive:true});
    await writeFile(path,value);
  }
  await writeFile('artifacts/engineering-optimizer/pull-request-body.md',built.body+'\n');
  process.stdout.write(JSON.stringify({obligationId:built.obligationId,paths:built.paths,body:'artifacts/engineering-optimizer/pull-request-body.md'})+'\n');
}

if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href){
  const [mode,runId,baseSha]=process.argv.slice(2);
  if(mode!=='--write')throw new Error('Usage: --write <run_id> <base_sha>');
  writeCandidateFromExistingArtifacts(runId,baseSha).catch(error=>{console.error(error);process.exitCode=1;});
}
