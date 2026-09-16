import { createHash } from 'node:crypto';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createSupabaseOutcomeObligationStores } from './outcome-obligation-supabase-store.mjs';

const PARTIAL_STATES = new Set(['COMMITTED','MERGED','PREVIEW_READY','DEPLOYED_UNVERIFIED','NOT_CLAIMED','DEELS LIVE','NIET GEDAAN','FAILED','RED','AWAITING_OUTCOME','MISSED_OBLIGATION','RECOVERING','PENDING','ACTIVE','PROMOTION_REQUIRED','READBACK_REQUIRED','WRITEBACK_REQUIRED']);
const FAILED_CONCLUSIONS = new Set(['failure','cancelled','skipped','timed_out','action_required','stale']);

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function digest(value) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export function classifyBackfillRecord(record = {}) {
  const idempotencyKey = text(record.idempotencyKey);
  const obligationId = text(record.obligationId);
  if (!idempotencyKey || !obligationId) throw new TypeError('backfill record requires idempotencyKey and obligationId');
  const status = text(record.status).toUpperCase();
  const conclusion = text(record.conclusion).toLowerCase();
  let action = 'IGNORE';
  let success = false;
  if (status === 'LIVE_VERIFIED' && record.liveVerifiedEvidence === true) {
    action = 'KEEP_CLOSED';
    success = true;
  } else if (['RESOLVED','BLOCKED_HARD_BOUNDARY','WAIT_EXTERNAL'].includes(status) && record.hardBoundary?.proven === true) {
    action = 'REOPEN_WAITING';
  } else if (PARTIAL_STATES.has(status) || FAILED_CONCLUSIONS.has(conclusion)) {
    action = 'REOPEN_ACTIVE';
  }
  return Object.freeze({
    idempotencyKey,
    obligationId,
    candidateIdentity:text(record.candidateIdentity) || null,
    productionIdentity:text(record.productionIdentity) || null,
    sourceStatus:status || null,
    sourceConclusion:conclusion || null,
    action,
    success,
  });
}

export function buildBackfillPlan(records = []) {
  if (!Array.isArray(records)) throw new TypeError('records must be an array');
  const byKey = new Map();
  const rank = { IGNORE:0, REOPEN_ACTIVE:1, REOPEN_WAITING:2, KEEP_CLOSED:3 };
  for (const record of records) {
    const classified = classifyBackfillRecord(record);
    const current = byKey.get(classified.idempotencyKey);
    if (!current || rank[classified.action] >= rank[current.action]) byKey.set(classified.idempotencyKey, classified);
  }
  return Object.freeze([...byKey.values()].sort((left, right) => left.idempotencyKey.localeCompare(right.idempotencyKey)));
}

export async function applyBackfillPlan(plan, { evidenceStore } = {}) {
  if (!Array.isArray(plan)) throw new TypeError('plan must be an array');
  if (!evidenceStore || typeof evidenceStore.putIfAbsent !== 'function') throw new TypeError('evidenceStore.putIfAbsent is required');
  const results = [];
  for (const item of plan) {
    if (!['REOPEN_ACTIVE','REOPEN_WAITING'].includes(item.action)) {
      results.push(Object.freeze({ created:false, skipped:true, item }));
      continue;
    }
    const fingerprint = digest(item);
    const persisted = await evidenceStore.putIfAbsent({
      idempotencyKey:item.idempotencyKey,
      ref:`backfill:${fingerprint}`,
      type:'BACKFILL_RECONCILIATION',
      producer:'COMPLETION_SUPERVISOR',
      taskIdentity:item.obligationId,
      candidateIdentity:item.candidateIdentity,
      productionIdentity:item.productionIdentity,
      independent:false,
      accepted:false,
      metadata:{ action:item.action, sourceStatus:item.sourceStatus, sourceConclusion:item.sourceConclusion, fingerprint },
    });
    results.push(Object.freeze({ ...persisted, item }));
  }
  return Object.freeze(results);
}

function parseArgs(argv) {
  const args = { input:null, output:'.artifacts/completion-supervisor-backfill.json', apply:false };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--apply') args.apply = true;
    else if (argv[index] === '--input' && argv[index + 1]) { args.input = argv[++index]; }
    else if (argv[index] === '--output' && argv[index + 1]) { args.output = argv[++index]; }
    else throw new TypeError(`unknown or incomplete CLI argument: ${argv[index]}`);
  }
  if (!args.input) throw new TypeError('--input is required');
  return args;
}

function recordsFromArtifact(artifact) {
  const decisions = Array.isArray(artifact?.decisions) ? artifact.decisions : [];
  return decisions.map(decision => ({
    idempotencyKey:decision.idempotencyKey,
    obligationId:decision.obligationId,
    status:decision.supervision?.normalized_state ?? decision.status,
    candidateIdentity:decision.supervision?.candidateIdentity ?? null,
    productionIdentity:decision.supervision?.productionIdentity ?? null,
    liveVerifiedEvidence:decision.supervision?.success === true,
    hardBoundary:decision.supervision?.normalized_state === 'WAIT_EXTERNAL' ? { proven:true } : null,
  }));
}

export async function runBackfillCli(argv = process.argv.slice(2), { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const args = parseArgs(argv);
  const artifact = JSON.parse(await readFile(args.input, 'utf8'));
  const plan = buildBackfillPlan(recordsFromArtifact(artifact));
  let results = [];
  if (args.apply) {
    const stores = createSupabaseOutcomeObligationStores({ url:env.SUPABASE_URL, token:env.SUPABASE_SERVICE_ROLE_KEY, fetchImpl });
    results = await applyBackfillPlan(plan, { evidenceStore:stores.evidenceStore });
  }
  const output = Object.freeze({ schemaVersion:1, mode:args.apply ? 'APPLY' : 'DRY_RUN', plan, results });
  await mkdir(args.output.split('/').slice(0, -1).join('/') || '.', { recursive:true });
  await writeFile(args.output, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runBackfillCli().catch(error => {
    console.error(error?.stack || error?.message || String(error));
    process.exitCode = 1;
  });
}
