import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createDefaultAgentRegistry } from '../platform/agents/agent-team.mjs';
import { evaluateOutcomeObligation, computeExecutionIdentity } from './outcome-obligation-executor.mjs';
import { createSupabaseOutcomeObligationStores } from './outcome-obligation-supabase-store.mjs';

function requireStore(store, name, methods) {
  if (!store || typeof store !== 'object') throw new TypeError(`${name} is required`);
  for (const method of methods) if (typeof store[method] !== 'function') throw new TypeError(`${name}.${method} is required`);
  return store;
}

export async function loadCanonicalObligations({ path = 'config/outcome-obligations.json' } = {}) {
  const parsed = JSON.parse(await readFile(path, 'utf8'));
  if (!Array.isArray(parsed.registeredObligations)) throw new TypeError('registeredObligations must be an array');
  const ids = new Set();
  return Object.freeze(parsed.registeredObligations.map(obligation => {
    if (!obligation?.id) throw new TypeError('obligation id is required');
    if (ids.has(obligation.id)) throw new Error(`duplicate obligation id: ${obligation.id}`);
    ids.add(obligation.id);
    return Object.freeze({ ...obligation });
  }));
}

function defaultDue(obligation, trigger) {
  if (trigger?.type === 'event-trigger') return obligation.dueAt?.includes('after_') || obligation.dueAt?.includes('and_after_') || obligation.dueAt?.includes('every_');
  return obligation.dueAt?.includes('daily') || obligation.dueAt?.includes('continuous') || obligation.dueAt?.includes('every_');
}

export function createOutcomeObligationRuntime({ registry, workStore, evidenceStore, recoveryStore, clock = () => new Date() }) {
  if (!registry || typeof registry.get !== 'function') throw new TypeError('registry.get is required');
  requireStore(workStore, 'workStore', ['get', 'putIfAbsent']);
  requireStore(evidenceStore, 'evidenceStore', ['list']);
  requireStore(recoveryStore, 'recoveryStore', ['get', 'putIfAbsent']);
  if (typeof clock !== 'function') throw new TypeError('clock must be a function');

  async function evaluateOne({ obligation, trigger, productionProofRequired = false, coalesceKey = null, due = undefined, evidenceDeadline = null, hardBoundary = null }) {
    const now = clock();
    const agent = registry.get(obligation.ownerAgent);
    const identity = computeExecutionIdentity({ obligation, now, trigger, coalesceKey });
    let priorWork = await workStore.get(identity.idempotencyKey);
    let priorRecovery = await recoveryStore.get(`recovery|${identity.idempotencyKey}`);
    const evidence = await evidenceStore.list(identity.idempotencyKey);
    const isDue = due ?? defaultDue(obligation, trigger);

    let decision = evaluateOutcomeObligation({ obligation, now, trigger, agent, due:isDue, priorWork, priorRecovery, evidence, hardBoundary, evidenceDeadline, productionProofRequired, coalesceKey });

    if (decision.dispatch) {
      const persisted = await workStore.putIfAbsent({
        ...decision.dispatch,
        traceId:decision.traceId,
        state:'PENDING',
        triggerFingerprint:decision.triggerFingerprint,
        executionWindow:decision.executionWindow,
      });
      priorWork = persisted.record;
      decision = evaluateOutcomeObligation({ obligation, now, trigger, agent, due:isDue, priorWork, priorRecovery, evidence, hardBoundary, evidenceDeadline, productionProofRequired, coalesceKey });
    }

    if (decision.recovery) {
      const persisted = await recoveryStore.putIfAbsent({ ...decision.recovery, traceId:decision.traceId, state:'RECOVERING' });
      priorRecovery = persisted.record;
      decision = evaluateOutcomeObligation({ obligation, now, trigger, agent, due:isDue, priorWork, priorRecovery, evidence, hardBoundary, evidenceDeadline, productionProofRequired, coalesceKey });
    }

    return Object.freeze({ ...decision });
  }

  return Object.freeze({
    async evaluateSweep({ trigger = { type:'scheduled-sweep', fingerprint:'scheduled' }, obligationIds = null, productionProofRequired = false, coalesceKey = null, due = undefined, evidenceDeadline = null, hardBoundary = null } = {}) {
      const obligations = await loadCanonicalObligations();
      const selected = obligationIds == null
        ? obligations
        : obligationIds.map(id => {
            const found = obligations.find(item => item.id === id);
            if (!found) throw new Error(`unknown obligation id: ${id}`);
            return found;
          });
      const results = [];
      for (const obligation of selected) results.push(await evaluateOne({ obligation, trigger, productionProofRequired, coalesceKey, due, evidenceDeadline, hardBoundary }));
      return Object.freeze(results);
    },
  });
}

function parseCliArgs(argv) {
  const args = { command:argv[0] ?? 'sweep', obligationIds:null, triggerType:null, fingerprint:null, now:null, output:'.artifacts/outcome-obligation-decisions.json' };
  for (let i = 1; i < argv.length; i += 1) {
    const value = argv[i + 1];
    if (argv[i] === '--obligation' && value) { args.obligationIds = [value]; i += 1; }
    else if (argv[i] === '--trigger-type' && value) { args.triggerType = value; i += 1; }
    else if (argv[i] === '--fingerprint' && value) { args.fingerprint = value; i += 1; }
    else if (argv[i] === '--now' && value) { args.now = value; i += 1; }
    else if (argv[i] === '--output' && value) { args.output = value; i += 1; }
    else throw new TypeError(`unknown or incomplete CLI argument: ${argv[i]}`);
  }
  return args;
}

function failClosedStores() {
  return {
    workStore:{ async get(){ return null; }, async putIfAbsent(){ throw new Error('durable_work_store_not_configured'); } },
    evidenceStore:{ async list(){ return []; } },
    recoveryStore:{ async get(){ return null; }, async putIfAbsent(){ throw new Error('durable_recovery_store_not_configured'); } },
  };
}

export function createOutcomeObligationCliStores({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const url = typeof env?.SUPABASE_URL === 'string' ? env.SUPABASE_URL.trim() : '';
  const token = typeof env?.SUPABASE_SERVICE_ROLE_KEY === 'string' ? env.SUPABASE_SERVICE_ROLE_KEY.trim() : '';
  if (url && token) {
    return Object.freeze({
      mode:'durable-supabase',
      hardBoundary:null,
      ...createSupabaseOutcomeObligationStores({ url, token, fetchImpl }),
    });
  }
  return Object.freeze({
    mode:'decision-only-fail-closed',
    hardBoundary:'durable_work_store_not_configured',
    ...failClosedStores(),
  });
}

export async function runOutcomeObligationCli(argv = process.argv.slice(2), { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const args = parseCliArgs(argv);
  const triggerType = args.triggerType ?? (args.command === 'event' ? 'event-trigger' : 'scheduled-sweep');
  const trigger = { type:triggerType, fingerprint:args.fingerprint ?? (triggerType === 'event-trigger' ? 'manual-event' : 'scheduled') };
  const stores = createOutcomeObligationCliStores({ env, fetchImpl });
  const runtime = createOutcomeObligationRuntime({
    registry:createDefaultAgentRegistry(),
    workStore:stores.workStore,
    evidenceStore:stores.evidenceStore,
    recoveryStore:stores.recoveryStore,
    clock:() => new Date(args.now ?? Date.now()),
  });
  const decisions = await runtime.evaluateSweep({
    trigger,
    obligationIds:args.obligationIds,
    hardBoundary:stores.hardBoundary,
  });
  const artifact = Object.freeze({
    schemaVersion:1,
    mode:stores.mode,
    productionMutation:false,
    decisions,
  });
  await mkdir(args.output.split('/').slice(0, -1).join('/') || '.', { recursive:true });
  await writeFile(args.output, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
  return artifact;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runOutcomeObligationCli().catch(error => {
    console.error(error?.stack || error?.message || String(error));
    process.exitCode = 1;
  });
}
