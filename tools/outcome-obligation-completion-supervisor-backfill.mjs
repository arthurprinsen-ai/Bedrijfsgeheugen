import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { evaluateCompletion } from '../platform/agents/completion-supervisor.mjs';
import { createSupabaseOutcomeObligationStores } from './outcome-obligation-supabase-store.mjs';
import { defaultDue, loadCanonicalObligations, runOutcomeObligationCli } from './outcome-obligation-runtime.mjs';

const PARTIAL_OBLIGATION_STATUSES = new Set(['PENDING','AWAITING_OUTCOME','MISSED_OBLIGATION','RECOVERING','BLOCKED_HARD_BOUNDARY']);
const PARTIAL_PR_CLAIMS = new Set(['COMMITTED','MERGED','PREVIEW_READY','DEPLOYED_UNVERIFIED','NOT_CLAIMED','DEELS LIVE','NIET GEDAAN','FAILED','RED']);
const NON_SUCCESS_WORKFLOW_CONCLUSIONS = new Set(['failure','cancelled','skipped','timed_out','action_required','stale','startup_failure']);
const MATERIAL_WORKFLOW = /(delivery|promotion|production|readback|required|deploy|release)/i;
const MODES = new Set(['shadow','active']);
const BACKFILL_TRIGGER_PREFIX = 'completion-backfill:';

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function stableKey(identity) {
  return createHash('sha256').update(String(identity)).digest('hex').slice(0, 20);
}

function normalizeRecoveryPacket(packet) {
  if (!packet || typeof packet !== 'object') return null;
  return Object.freeze({
    blocker:packet.blocker,
    root_cause:packet.root_cause ?? packet.rootCause,
    evidence_refs:packet.evidence_refs ?? packet.evidenceRefs,
    attempted_repairs:packet.attempted_repairs ?? packet.attemptedRepairs ?? packet.attemptedFixes,
    safe_remaining_actions:packet.safe_remaining_actions ?? packet.safeRemainingActions,
    minimum_human_action:packet.minimum_human_action ?? packet.minimumHumanAction,
    fix_agent_handoff:packet.fix_agent_handoff ?? packet.fixAgentHandoff,
    boundary_fingerprint:packet.boundary_fingerprint ?? packet.boundaryFingerprint,
    resume_when:packet.resume_when ?? packet.resumeWhen,
  });
}

function normalizeHardBoundary(boundary) {
  if (!boundary || typeof boundary !== 'object') return null;
  return Object.freeze({
    ...boundary,
    recovery_packet:normalizeRecoveryPacket(boundary.recovery_packet ?? boundary.recoveryPacket),
  });
}

function completionFor(record) {
  return evaluateCompletion({
    obligationId:record.obligationId ?? record.id ?? `backfill:${record.identity}`,
    workId:record.workId ?? `backfill:${record.identity}`,
    claim:record.claim ?? record.status ?? null,
    candidateIdentity:record.candidateIdentity ?? record.identity,
    productionIdentity:record.productionIdentity ?? null,
    materialObligations:Array.isArray(record.materialObligations) ? record.materialObligations : [],
    evidence:Array.isArray(record.evidence) ? record.evidence : [],
    hardBoundary:normalizeHardBoundary(record.hardBoundary),
    retry:{
      hypothesis:record.retryHypothesis ?? null,
      attemptCount:Number.isInteger(record.attemptCount) ? record.attemptCount : 0,
      newEvidence:record.newEvidence === true,
    },
  });
}

function sourceRecord(sourceKind, sourceId, identity, record, reason) {
  return Object.freeze({ sourceKind, sourceId:String(sourceId), identity, reason, record:Object.freeze({ ...record }) });
}

function candidateFromGroup(identity, sources) {
  const representative = sources.find(source => source.sourceKind === 'obligation')?.record
    ?? sources.find(source => source.sourceKind === 'pull_request')?.record
    ?? sources[0]?.record
    ?? {};
  // An identity can contain multiple original source observations. A proven
  // external boundary in ANY of them vetoes the entire grouped candidate:
  // selecting only the first obligation would silently drop later consent,
  // security or provider restrictions with the same source identity.
  const sourceDecisions = sources.map(source => completionFor({ ...source.record, identity }));
  const decision = sourceDecisions.find(item => item.next_action === 'WAIT_EXTERNAL')
    ?? completionFor({ ...representative, identity });
  const obligationIds = [...new Set(sources
    .filter(source => source.sourceKind === 'obligation')
    .map(source => text(source.record?.id) || text(source.sourceId))
    .filter(Boolean))]
    .sort();
  return Object.freeze({
    identity,
    lineageKey:`completion-backfill|${stableKey(identity)}`,
    sourceKinds:Object.freeze([...new Set(sources.map(source => source.sourceKind))].sort()),
    sourceIds:Object.freeze(sources.map(source => `${source.sourceKind}:${source.sourceId}`).sort()),
    reasons:Object.freeze([...new Set(sources.map(source => source.reason))].sort()),
    obligationIds:Object.freeze(obligationIds),
    normalizedState:decision.normalized_state,
    nextAction:decision.next_action,
    openObligations:decision.open_obligations,
    requiredEvidence:decision.required_evidence,
    idempotencyKey:decision.idempotency_key
  });
}

function activeDispatches(candidates, registeredObligationIds = null) {
  const registered = registeredObligationIds == null
    ? null
    : new Set((registeredObligationIds ?? []).map(text).filter(Boolean));
  // The historical source candidates remain in report.candidates. They are not
  // one actionable external event each: many map to the same registered owner.
  // A stable obligation-level coalesce key prevents a backfill from amplifying
  // thousands of old observations into thousands of new PENDING agent tasks.
  const byObligation = new Map();
  // A proven external authorization boundary applies to the whole original
  // obligation. Another historical source must never reopen it by accident.
  const hardBoundaryObligations = new Set();
  for (const candidate of candidates) {
    for (const obligationId of candidate.obligationIds) {
      if (registered && !registered.has(obligationId)) continue;
      if (candidate.nextAction === 'WAIT_EXTERNAL') {
        hardBoundaryObligations.add(obligationId);
        continue;
      }
      let group = byObligation.get(obligationId);
      if (!group) {
        group = { sourceIdentities:new Set(), nextAction:candidate.nextAction };
        byObligation.set(obligationId, group);
      }
      group.sourceIdentities.add(candidate.identity);
    }
  }
  const dispatches = [];
  for (const obligationId of [...byObligation.keys()].sort()) {
    if (hardBoundaryObligations.has(obligationId)) continue;
    const group = byObligation.get(obligationId);
    const sourceIdentities = [...group.sourceIdentities].sort();
    const canonicalIdentity = 'canonical-obligation:' + obligationId;
    const stableFingerprint = stableKey(canonicalIdentity);
    dispatches.push(Object.freeze({
      obligationId,
      identity:canonicalIdentity,
      coalesceKey:'completion-backfill|obligation|' + stableFingerprint,
      triggerFingerprint:BACKFILL_TRIGGER_PREFIX + stableFingerprint,
      nextAction:group.nextAction,
      sourceCandidateCount:sourceIdentities.length,
      sourceIdentityDigest:createHash('sha256').update(JSON.stringify(sourceIdentities)).digest('hex'),
    }));
  }
  return Object.freeze(dispatches);
}

export function reconcileCompletionBackfill({ pullRequests = [], workflowRuns = [], obligations = [], mode = 'shadow', registeredObligationIds = null } = {}) {
  const normalizedMode = text(mode).toLowerCase() || 'shadow';
  if (!MODES.has(normalizedMode)) throw new TypeError(`unsupported backfill mode: ${mode}`);
  const grouped = new Map();
  const skippedLiveVerified = [];
  const add = source => {
    if (!grouped.has(source.identity)) grouped.set(source.identity, []);
    grouped.get(source.identity).push(source);
  };

  for (const pr of Array.isArray(pullRequests) ? pullRequests : []) {
    const identity = text(pr?.headSha) || text(pr?.identity);
    if (!identity) continue;
    const decision = completionFor({ ...pr, identity });
    if (decision.success) {
      skippedLiveVerified.push(Object.freeze({ identity, sourceKind:'pull_request', sourceId:String(pr.number ?? identity) }));
      continue;
    }
    const claim = text(pr.claim).toUpperCase();
    if (pr.state === 'open' || PARTIAL_PR_CLAIMS.has(claim)) add(sourceRecord('pull_request', pr.number ?? identity, identity, pr, pr.state === 'open' ? 'open_pull_request' : `partial_claim:${claim}`));
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
    if (NON_SUCCESS_WORKFLOW_CONCLUSIONS.has(conclusion)) add(sourceRecord('workflow_run', run.id ?? identity, identity, run, `workflow_${conclusion}`));
    else if (conclusion === 'success') add(sourceRecord('workflow_run', run.id ?? identity, identity, run, 'workflow_success_without_full_completion_evidence'));
  }

  for (const obligation of Array.isArray(obligations) ? obligations : []) {
    if (text(obligation?.triggerFingerprint).startsWith(BACKFILL_TRIGGER_PREFIX)) continue;
    const identity = text(obligation?.identity) || text(obligation?.idempotencyKey) || text(obligation?.id);
    if (!identity) continue;
    const decision = completionFor({ ...obligation, identity });
    if (decision.success) {
      skippedLiveVerified.push(Object.freeze({ identity, sourceKind:'obligation', sourceId:String(obligation.id ?? identity) }));
      continue;
    }
    const status = text(obligation.status).toUpperCase();
    if (PARTIAL_OBLIGATION_STATUSES.has(status) || status !== 'COMPLETED') add(sourceRecord('obligation', obligation.id ?? identity, identity, obligation, `obligation_${status || 'UNKNOWN'}`));
    else add(sourceRecord('obligation', obligation.id ?? identity, identity, obligation, 'completed_without_live_verified_evidence'));
  }

  const candidates = [...grouped.entries()].map(([identity, sources]) => candidateFromGroup(identity, sources)).sort((a, b) => a.identity.localeCompare(b.identity));
  const uniqueSkipped = [...new Map(skippedLiveVerified.map(item => [`${item.identity}|${item.sourceKind}|${item.sourceId}`, item])).values()].sort((a, b) => a.identity.localeCompare(b.identity));
  const dispatches = normalizedMode === 'active' ? activeDispatches(candidates, registeredObligationIds) : Object.freeze([]);
  return Object.freeze({
    schemaVersion:2,
    mode:normalizedMode,
    productionMutation:false,
    durableResumeEnabled:normalizedMode === 'active',
    generatedFrom:'existing-authorities',
    candidateCount:candidates.length,
    candidates:Object.freeze(candidates),
    skippedLiveVerified:Object.freeze(uniqueSkipped),
    dispatches
  });
}

// Historical readback is not itself an external write. Only the original
// obligation's declared due policy can authorize its original recovery trigger.
export function selectOriginalBackfillTrigger(obligation) {
  if (!obligation || typeof obligation !== 'object') throw new TypeError('registered original obligation is required');
  if (defaultDue(obligation, {type:'event-trigger'}) === true) return 'event-trigger';
  if (defaultDue(obligation, {type:'scheduled-sweep'}) === true) return 'scheduled-sweep';
  return null;
}

export function applyOriginalBackfillDuePolicy(report, registeredObligations) {
  if (!Array.isArray(registeredObligations)) throw new TypeError('registered original obligations must be provided');
  const known = new Map(registeredObligations.map(obligation => [obligation.id, obligation]));
  const dispatches = [];
  const deferredNotDue = [];
  for (const dispatch of report?.dispatches ?? []) {
    const obligation = known.get(dispatch.obligationId);
    if (!obligation) throw new Error('Backfill original registered obligation missing: '+dispatch.obligationId);
    const triggerType = selectOriginalBackfillTrigger(obligation);
    if (triggerType === null) {
      // Do not fabricate an event solely to satisfy an actual pre-write,
      // consent or other non-scheduled boundary. Its full source audit stays
      // in the same report, and original owner remains responsible.
      deferredNotDue.push(Object.freeze({ ...dispatch,
        reason:'NO_ORIGINAL_DUE_TRIGGER_FOR_BACKFILL',
        dueAt:obligation.dueAt ?? null,
        nextSafeAction:'WAIT_FOR_ORIGINAL_SOURCE_TRIGGER' }));
    } else {
      dispatches.push(Object.freeze({ ...dispatch, triggerType }));
    }
  }
  return Object.freeze({ ...report,
    dispatches:Object.freeze(dispatches),
    deferredNotDue:Object.freeze(deferredNotDue) });
}

export function checkpointCompletionBackfill(report, resumeResults = [], state = 'IN_PROGRESS', at = new Date().toISOString()) {
  const dispatches = report?.dispatches;
  if (!Array.isArray(dispatches) || !Array.isArray(resumeResults))
    throw new TypeError('canonical backfill dispatches and resume results are required');
  if (state !== 'IN_PROGRESS' && state !== 'COMPLETE')
    throw new TypeError('unsupported backfill progress state');
  if (new Set(dispatches.map(d => d?.obligationId)).size !== dispatches.length
      || dispatches.some(d => !d?.obligationId || !d?.coalesceKey))
    throw new Error('original backfill invariant failed: more than one wakeup per canonical obligation');
  if (resumeResults.length > dispatches.length)
    throw new Error('original backfill invariant failed: more results than canonical wakeups');
  for (let i = 0; i < resumeResults.length; i += 1) {
    const expected = dispatches[i];
    const observed = resumeResults[i]?.dispatch;
    if (!observed || observed.obligationId !== expected.obligationId
        || observed.coalesceKey !== expected.coalesceKey
        || typeof resumeResults[i]?.output !== 'string' || !resumeResults[i].output)
      throw new Error('original backfill invariant failed: missing exact ordered resume receipt');
  }
  if (state === 'COMPLETE' && resumeResults.length !== dispatches.length)
    throw new Error('original backfill incomplete: no final completion claim without every resume');
  return Object.freeze({
    ...report,
    resumeResults:Object.freeze([...resumeResults]),
    resumeCheckpoint:Object.freeze({
      state,
      sourceCandidates:report.candidateCount,
      expectedDispatches:dispatches.length,
      completedDispatches:resumeResults.length,
      remainingDispatches:dispatches.length - resumeResults.length,
      checkpointedAt:at,
      // A COMPLETE checkpoint proves the backfill resumed canonical work;
      // it never proves those owners performed the underlying provider action.
      consumerCompletionProven:false,
      businessOutcomeProven:false
    })
  });
}

export async function executeCompletionBackfillDispatches(report, { env = process.env, fetchImpl = globalThis.fetch, outputDir = '.artifacts/completion-supervisor-resume', onResult = null } = {}) {
  if (report?.mode !== 'active') return Object.freeze([]);
  if (onResult !== null && typeof onResult !== 'function') throw new TypeError('onResult must be a function');
  const results = [];
  for (let index = 0; index < (report.dispatches ?? []).length; index += 1) {
    const dispatch = report.dispatches[index];
    const output = `${outputDir}-${String(index + 1).padStart(3, '0')}.json`;
    if (!['event-trigger','scheduled-sweep'].includes(dispatch.triggerType)) {
      throw new Error('Backfill original due trigger is missing: '+dispatch.obligationId);
    }
    const artifact = await runOutcomeObligationCli([
      'event',
      '--obligation', dispatch.obligationId,
      '--trigger-type', dispatch.triggerType,
      '--fingerprint', dispatch.triggerFingerprint,
      '--coalesce-key', dispatch.coalesceKey,
      '--output', output
    ], { env, fetchImpl });
    if (artifact?.mode !== 'durable-supabase'
      || artifact.decisions?.length !== 1
      || artifact.decisions[0]?.obligationId !== dispatch.obligationId
      || artifact.decisions[0]?.status === 'NOT_DUE') {
      throw new Error('Backfill original consumer durable due/readback unverified: '+dispatch.obligationId);
    }
    const result = Object.freeze({ dispatch, output, artifact });
    results.push(result);
    if (onResult) await onResult(result);
  }
  return Object.freeze(results);
}

async function githubJson(endpoint, { token, fetchImpl }) {
  const response = await fetchImpl(`https://api.github.com${endpoint}`, {
    headers:{ accept:'application/vnd.github+json', authorization:`Bearer ${token}`, 'x-github-api-version':'2022-11-28' }
  });
  if (!response.ok) throw new Error(`GitHub backfill authority read failed: ${response.status}`);
  return response.json();
}

export async function collectCompletionBackfillSnapshot({
  repository = process.env.GITHUB_REPOSITORY,
  githubToken = process.env.GITHUB_TOKEN,
  supabaseUrl = process.env.SUPABASE_URL,
  supabaseToken = process.env.SUPABASE_SERVICE_ROLE_KEY,
  fetchImpl = globalThis.fetch
} = {}) {
  const repo = text(repository);
  const token = text(githubToken);
  if (!repo || !/^[^/]+\/[^/]+$/.test(repo)) throw new TypeError('GITHUB_REPOSITORY must be owner/repo');
  if (!token) throw new TypeError('GITHUB_TOKEN is required for backfill authority read');
  if (!text(supabaseUrl) || !text(supabaseToken)) throw new TypeError('Supabase server-only credentials are required for backfill authority read');
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function');

  const [prs, runPayload] = await Promise.all([
    githubJson(`/repos/${repo}/pulls?state=open&per_page=100`, { token, fetchImpl }),
    githubJson(`/repos/${repo}/actions/runs?per_page=100`, { token, fetchImpl })
  ]);
  const stores = createSupabaseOutcomeObligationStores({ url:supabaseUrl, token:supabaseToken, fetchImpl });
  const [workRows, recoveryRows] = await Promise.all([stores.workStore.list(), stores.recoveryStore.list()]);

  const pullRequests = (Array.isArray(prs) ? prs : []).map(pr => Object.freeze({ number:pr.number, headSha:pr.head?.sha, state:pr.state, claim:'NOT_CLAIMED', title:pr.title ?? null }));
  const workflowRuns = (Array.isArray(runPayload?.workflow_runs) ? runPayload.workflow_runs : [])
    .filter(run => MATERIAL_WORKFLOW.test(String(run.name ?? '')))
    .map(run => Object.freeze({ id:run.id, headSha:run.head_sha, name:run.name, status:run.status, conclusion:run.conclusion }));
  const obligations = [...workRows, ...recoveryRows].map(row => Object.freeze({ id:row.obligationId, identity:row.idempotencyKey, idempotencyKey:row.idempotencyKey, status:row.state, ownerAgent:row.ownerAgent, recordType:row.type, triggerFingerprint:row.triggerFingerprint ?? null }));

  return Object.freeze({ pullRequests:Object.freeze(pullRequests), workflowRuns:Object.freeze(workflowRuns), obligations:Object.freeze(obligations) });
}

async function main(argv = process.argv.slice(2)) {
  let input = '.artifacts/completion-supervisor-backfill-input.json';
  let output = '.artifacts/completion-supervisor-backfill-report.json';
  let collect = false;
  let mode = 'shadow';
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--input' && argv[i + 1]) { input = argv[++i]; continue; }
    if (argv[i] === '--output' && argv[i + 1]) { output = argv[++i]; continue; }
    if (argv[i] === '--collect') { collect = true; continue; }
    if (argv[i] === '--mode' && argv[i + 1]) { mode = argv[++i]; continue; }
    throw new TypeError(`unknown or incomplete CLI argument: ${argv[i]}`);
  }
  const snapshot = collect ? await collectCompletionBackfillSnapshot() : JSON.parse(await readFile(input, 'utf8'));
  const canonical = await loadCanonicalObligations();
  const proposed = reconcileCompletionBackfill({ ...snapshot, mode, registeredObligationIds:canonical.map(item => item.id) });
  const report = applyOriginalBackfillDuePolicy(proposed, canonical);
  await mkdir(output.split('/').slice(0, -1).join('/') || '.', { recursive:true });
  const completed = [];
  // The same original owner stores an atomic checkpoint before the first
  // allowed resume; a failed owner step leaves its last truthful progress.
  const persist = async state => {
    const checkpoint = checkpointCompletionBackfill(report, completed, state);
    const tempPath = `${output}.checkpoint-${process.pid}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(checkpoint, null, 2)}\n`, 'utf8');
    await rename(tempPath, output);
    return checkpoint;
  };
  await persist('IN_PROGRESS');
  await executeCompletionBackfillDispatches(report, { onResult: async result => {
    completed.push(result);
    await persist('IN_PROGRESS');
  }});
  return persist('COMPLETE');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error?.stack || error?.message || String(error));
    process.exitCode = 1;
  });
}
