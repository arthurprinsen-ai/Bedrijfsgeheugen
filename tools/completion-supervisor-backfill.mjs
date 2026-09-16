import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { evaluateCompletion } from '../platform/agents/completion-supervisor.mjs';

const PARTIAL_OBLIGATION_STATUSES = new Set(['PENDING','AWAITING_OUTCOME','MISSED_OBLIGATION','RECOVERING','BLOCKED_HARD_BOUNDARY']);
const PARTIAL_PR_CLAIMS = new Set(['COMMITTED','MERGED','PREVIEW_READY','DEPLOYED_UNVERIFIED','NOT_CLAIMED','DEELS LIVE','NIET GEDAAN','FAILED','RED']);
const NON_SUCCESS_WORKFLOW_CONCLUSIONS = new Set(['failure','cancelled','skipped','timed_out','action_required','stale','startup_failure']);

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function stableKey(identity) {
  return createHash('sha256').update(String(identity)).digest('hex').slice(0, 20);
}

function completionFor(record) {
  return evaluateCompletion({
    identity:record.identity,
    claim:record.claim ?? record.status ?? null,
    materialObligations:Array.isArray(record.materialObligations) ? record.materialObligations : [],
    completionEvidence:record.completionEvidence ?? null,
    hardBoundary:record.hardBoundary ?? null,
    retryHypothesis:record.retryHypothesis ?? null,
    attemptCount:Number.isInteger(record.attemptCount) ? record.attemptCount : 0
  });
}

function sourceRecord(sourceKind, sourceId, identity, record, reason) {
  return Object.freeze({
    sourceKind,
    sourceId:String(sourceId),
    identity,
    reason,
    record:Object.freeze({ ...record })
  });
}

function candidateFromGroup(identity, sources) {
  const representative = sources.find(source => source.sourceKind === 'obligation')?.record
    ?? sources.find(source => source.sourceKind === 'pull_request')?.record
    ?? sources[0]?.record
    ?? {};
  const decision = completionFor({ ...representative, identity });
  return Object.freeze({
    identity,
    lineageKey:`completion-backfill|${stableKey(identity)}`,
    sourceKinds:Object.freeze([...new Set(sources.map(source => source.sourceKind))].sort()),
    sourceIds:Object.freeze(sources.map(source => `${source.sourceKind}:${source.sourceId}`).sort()),
    reasons:Object.freeze([...new Set(sources.map(source => source.reason))].sort()),
    normalizedState:decision.normalized_state,
    nextAction:decision.next_action,
    openObligations:decision.open_obligations,
    requiredEvidence:decision.required_evidence,
    idempotencyKey:decision.idempotency_key
  });
}

export function reconcileCompletionBackfill({ pullRequests = [], workflowRuns = [], obligations = [] } = {}) {
  const grouped = new Map();
  const skippedLiveVerified = [];

  function add(source) {
    if (!grouped.has(source.identity)) grouped.set(source.identity, []);
    grouped.get(source.identity).push(source);
  }

  for (const pr of Array.isArray(pullRequests) ? pullRequests : []) {
    const identity = text(pr?.headSha) || text(pr?.identity);
    if (!identity) continue;
    const decision = completionFor({ ...pr, identity });
    if (decision.success) {
      skippedLiveVerified.push(Object.freeze({ identity, sourceKind:'pull_request', sourceId:String(pr.number ?? identity) }));
      continue;
    }
    const claim = text(pr.claim).toUpperCase();
    if (pr.state === 'open' || PARTIAL_PR_CLAIMS.has(claim)) {
      add(sourceRecord('pull_request', pr.number ?? identity, identity, pr, pr.state === 'open' ? 'open_pull_request' : `partial_claim:${claim}`));
    }
  }

  for (const run of Array.isArray(workflowRuns) ? workflowRuns : []) {
    const identity = text(run?.headSha) || text(run?.identity);
    if (!identity) continue;
    const decision = completionFor({ ...run, identity });
    if (decision.success) {
      skippedLiveVerified.push(Object.freeze({ identity, sourceKind:'workflow_run', sourceId:String(run.id ?? identity) }));
      continue;
    }
    const conclusion = text(run.conclusion).toLowerCase();
    if (NON_SUCCESS_WORKFLOW_CONCLUSIONS.has(conclusion)) {
      add(sourceRecord('workflow_run', run.id ?? identity, identity, run, `workflow_${conclusion}`));
    } else if (conclusion === 'success') {
      add(sourceRecord('workflow_run', run.id ?? identity, identity, run, 'workflow_success_without_full_completion_evidence'));
    }
  }

  for (const obligation of Array.isArray(obligations) ? obligations : []) {
    const identity = text(obligation?.identity) || text(obligation?.idempotencyKey) || text(obligation?.id);
    if (!identity) continue;
    const decision = completionFor({ ...obligation, identity });
    if (decision.success) {
      skippedLiveVerified.push(Object.freeze({ identity, sourceKind:'obligation', sourceId:String(obligation.id ?? identity) }));
      continue;
    }
    const status = text(obligation.status).toUpperCase();
    if (PARTIAL_OBLIGATION_STATUSES.has(status) || status !== 'COMPLETED') {
      add(sourceRecord('obligation', obligation.id ?? identity, identity, obligation, `obligation_${status || 'UNKNOWN'}`));
    } else {
      add(sourceRecord('obligation', obligation.id ?? identity, identity, obligation, 'completed_without_live_verified_evidence'));
    }
  }

  const candidates = [...grouped.entries()]
    .map(([identity, sources]) => candidateFromGroup(identity, sources))
    .sort((a, b) => a.identity.localeCompare(b.identity));

  const uniqueSkipped = [...new Map(skippedLiveVerified.map(item => [`${item.identity}|${item.sourceKind}|${item.sourceId}`, item])).values()]
    .sort((a, b) => a.identity.localeCompare(b.identity));

  return Object.freeze({
    schemaVersion:1,
    mode:'shadow',
    productionMutation:false,
    generatedFrom:'existing-authorities',
    candidateCount:candidates.length,
    candidates:Object.freeze(candidates),
    skippedLiveVerified:Object.freeze(uniqueSkipped),
    dispatches:Object.freeze([])
  });
}

async function main(argv = process.argv.slice(2)) {
  let input = '.artifacts/completion-supervisor-backfill-input.json';
  let output = '.artifacts/completion-supervisor-backfill-report.json';
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--input' && argv[i + 1]) { input = argv[++i]; continue; }
    if (argv[i] === '--output' && argv[i + 1]) { output = argv[++i]; continue; }
    throw new TypeError(`unknown or incomplete CLI argument: ${argv[i]}`);
  }
  const snapshot = JSON.parse(await readFile(input, 'utf8'));
  const report = reconcileCompletionBackfill(snapshot);
  await mkdir(output.split('/').slice(0, -1).join('/') || '.', { recursive:true });
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error?.stack || error?.message || String(error));
    process.exitCode = 1;
  });
}
