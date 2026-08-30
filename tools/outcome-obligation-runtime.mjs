import { readFile } from 'node:fs/promises';
import { evaluateOutcomeObligation, computeExecutionIdentity } from './outcome-obligation-executor.mjs';

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

    let decision = evaluateOutcomeObligation({
      obligation,
      now,
      trigger,
      agent,
      due:isDue,
      priorWork,
      priorRecovery,
      evidence,
      hardBoundary,
      evidenceDeadline,
      productionProofRequired,
      coalesceKey,
    });

    if (decision.dispatch) {
      const persisted = await workStore.putIfAbsent({
        ...decision.dispatch,
        traceId:decision.traceId,
        state:'PENDING',
        triggerFingerprint:decision.triggerFingerprint,
        executionWindow:decision.executionWindow,
      });
      priorWork = persisted.record;
      decision = evaluateOutcomeObligation({
        obligation,
        now,
        trigger,
        agent,
        due:isDue,
        priorWork,
        priorRecovery,
        evidence,
        hardBoundary,
        evidenceDeadline,
        productionProofRequired,
        coalesceKey,
      });
    }

    if (decision.recovery) {
      const persisted = await recoveryStore.putIfAbsent({
        ...decision.recovery,
        traceId:decision.traceId,
        state:'RECOVERING',
      });
      priorRecovery = persisted.record;
      decision = evaluateOutcomeObligation({
        obligation,
        now,
        trigger,
        agent,
        due:isDue,
        priorWork,
        priorRecovery,
        evidence,
        hardBoundary,
        evidenceDeadline,
        productionProofRequired,
        coalesceKey,
      });
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
      for (const obligation of selected) {
        results.push(await evaluateOne({ obligation, trigger, productionProofRequired, coalesceKey, due, evidenceDeadline, hardBoundary }));
      }
      return Object.freeze(results);
    },
  });
}
