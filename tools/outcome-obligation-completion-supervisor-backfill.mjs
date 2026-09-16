import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { evaluateCompletion } from '../platform/agents/completion-supervisor.mjs';
import { createSupabaseOutcomeObligationStores } from './outcome-obligation-supabase-store.mjs';
import { loadCanonicalObligations, runOutcomeObligationCli } from './outcome-obligation-runtime.mjs';

const PARTIAL_OBLIGATION_STATUSES = new Set(['PENDING','AWAITING_OUTCOME','MISSED_OBLIGATION','RECOVERING','BLOCKED_HARD_BOUNDARY']);
const PARTIAL_PR_CLAIMS = new Set(['COMMITTED','MERGED','PREVIEW_READY','DEPLOYED_UNVERIFIED','NOT_CLAIMED','DEELS LIVE','NIET GEDAAN','FAILED','RED']);
const NON_SUCCESS_WORKFLOW_CONCLUSIONS = new Set(['failure','cancelled','skipped','timed_out','action_required','stale','startup_failure']);
const MATERIAL_WORKFLOW = /(delivery|promotion|production|readback|required|deploy|release)/i;
const MODES = new Set(['shadow','active']);

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function stableKey(identity) {
  return createHash('sha256').update(String(identity)).digest('hex').slice(0, 20);
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
    hardBoundary:record.hardBoundary ?? null,
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
  const decision = completionFor({ ...representative, identity });
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
  const dispatches = [];
  for (const candidate of candidates) {
    if (candidate.nextAction === 'WAIT_EXTERNAL') continue;
    for (const obligationId of candidate.obligationIds) {
      if (registered && !registered.has(obligationId)) continue;
      dispatches.push(Object.freeze({
        obligationId,
        identity:candidate.identity,
        coalesceKey:candidate.lineageKey,
        triggerFingerprint:`completion-backfill:${candidate.idempotencyKey}`,
        nextAction:candidate.nextAction
      }));
    }
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

export async function executeCompletionBackfillDispatches(report, { env = process.env, fetchImpl = globalThis.fetch, outputDir = '.artifacts/completion-supervisor-resume' } = {}) {
  if (report?.mode !== 'active') return Object.freeze([]);
  const results = [];
  for (let index = 0; index < (report.dispatches ?? []).length; index += 1) {
    const dispatch = report.dispatches[index];
    const output = `${outputDir}-${String(index + 1).padStart(3, '0')}.json`;
    const artifact = await runOutcomeObligationCli([
      'event',
      '--obligation', dispatch.obligationId,
      '--trigger-type', 'event-trigger',
      '--fingerprint', dispatch.triggerFingerprint,
      '--coalesce-key', dispatch.coalesceKey,
      '--output', output
    ], { env, fetchImpl });
    results.push(Object.freeze({ dispatch, output, artifact }));
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
  const obligations = [...workRows, ...recoveryRows].map(row => Object.freeze({ id:row.obligationId, identity:row.idempotencyKey, idempotencyKey:row.idempotencyKey, status:row.state, ownerAgent:row.ownerAgent, recordType:row.type }));

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
  const report = reconcileCompletionBackfill({ ...snapshot, mode, registeredObligationIds:canonical.map(item => item.id) });
  const resumeResults = await executeCompletionBackfillDispatches(report);
  const finalReport = Object.freeze({ ...report, resumeResults });
  await mkdir(output.split('/').slice(0, -1).join('/') || '.', { recursive:true });
  await writeFile(output, `${JSON.stringify(finalReport, null, 2)}\n`, 'utf8');
  return finalReport;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error?.stack || error?.message || String(error));
    process.exitCode = 1;
  });
}
