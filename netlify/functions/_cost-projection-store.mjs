import { getStore } from '@netlify/blobs';
import { createDefaultAgentRegistry } from '../../platform/agents/agent-team.mjs';
import { buildComponentCatalog } from '../../platform/cost/component-catalog.mjs';

const STORE_NAME = 'brain-read-models';
const STORE_KEY = 'POWERHOUSE/cost-dashboard/current';
const COST_DATA_SOURCE_ID = '3d0a748e-62ea-4a5f-a888-b8426b8ec1f5';

function textValue(property) {
  return (property?.rich_text ?? property?.title ?? []).map(part => part.plain_text ?? part.text?.content ?? '').join('');
}

function budgetFrom(snapshot) {
  const monthlyLimit = 10_000;
  const usedCredits = Number(snapshot.budget?.used_credits ?? snapshot.total?.centicredits / 100 ?? 0);
  const remainingCredits = Math.max(0, monthlyLimit - usedCredits);
  const sampledAt = new Date(snapshot.at ?? Date.now());
  const remainingDays = Math.max(1, new Date(Date.UTC(sampledAt.getUTCFullYear(), sampledAt.getUTCMonth() + 1, 0)).getUTCDate() - sampledAt.getUTCDate() + 1);
  const dailyAllowance = Number(snapshot.budget?.daily_allowance ?? remainingCredits / remainingDays);
  const paceRatio = dailyAllowance > 0 ? Number(snapshot.delta?.credits ?? 0) / dailyAllowance : usedCredits / monthlyLimit;
  const state = snapshot.budget?.state ?? (usedCredits >= monthlyLimit || paceRatio >= 1 ? 'EXHAUSTED' : paceRatio >= 0.9 ? 'RED' : paceRatio >= 0.7 ? 'ORANGE' : 'GREEN');
  return {
    monthlyLimit,
    usedCredits,
    remainingCredits,
    dailyAllowance,
    paceRatio,
    state,
    decision: snapshot.budget?.decision ?? (state === 'EXHAUSTED' || state === 'RED' ? 'BUDGET_DEFERRED' : state === 'ORANGE' ? 'CHEAP_PATH' : 'RUN'),
  };
}

function componentsFrom(snapshot) {
  const source = snapshot.catalog?.length ? snapshot.catalog : [...(snapshot.top ?? []), ...(snapshot.watched ?? [])];
  const byId = new Map();
  for (const row of source) {
    const id = Number(row.id);
    if (!Number.isFinite(id) || byId.has(id)) continue;
    byId.set(id, {
      componentKey: `make:${id}`,
      name: String(row.n ?? row.name ?? `Make scenario ${id}`),
      kind: 'MAKE_SCENARIO',
      active: String(row.state ?? 'active') === 'active',
      costClass: row.cost_class ?? 'unclassified',
      classificationState: row.cost_class ? 'CLASSIFIED' : 'UNCLASSIFIED',
      runDecision: row.run_decision ?? (row.cost_class ? 'RUN' : 'BUDGET_DEFERRED'),
      creditsDelta: Number(row.dc ?? row.daily_credits ?? 0),
      operationsDelta: Number(row.dops ?? row.daily_operations ?? 0),
      dataTransferDelta: Number(row.dt ?? row.daily_transfer ?? 0),
      verifiedOutcomes: Number(row.verified_outcomes ?? 0),
      creditsPerVerifiedOutcome: Number.isFinite(Number(row.credits_per_verified_outcome)) ? Number(row.credits_per_verified_outcome) : null,
      latencyMsPerVerifiedOutcome: Number.isFinite(Number(row.latency_per_verified_outcome_ms)) ? Number(row.latency_per_verified_outcome_ms) : null,
    });
  }
  return [...byId.values()];
}

function agentComponentsFrom(snapshot, sourceUpdatedAt) {
  const catalog = buildComponentCatalog({
    agents: createDefaultAgentRegistry().all(),
    now: () => snapshot.at ?? sourceUpdatedAt ?? new Date().toISOString(),
  });
  return [...catalog.values()].map(agent => ({
    componentKey: agent.componentKey,
    name: agent.name,
    kind: agent.kind,
    active: agent.active,
    costClass: agent.costClass,
    classificationState: agent.classificationState,
    runDecision: agent.runDecision,
    creditsDelta: 0,
    operationsDelta: 0,
    dataTransferDelta: 0,
    verifiedOutcomes: 0,
    creditsPerVerifiedOutcome: null,
    latencyMsPerVerifiedOutcome: null,
  }));
}

function recordFromSnapshot(snapshot, sourceUpdatedAt) {
  const components = [...componentsFrom(snapshot), ...agentComponentsFrom(snapshot, sourceUpdatedAt)];
  return {
    schemaVersion: 1,
    sourceUpdatedAt: snapshot.at ?? sourceUpdatedAt,
    budget: budgetFrom(snapshot),
    totals: {
      creditsTotal: Number(snapshot.total?.centicredits ?? 0) / 100,
      creditsDelta: Number(snapshot.delta?.credits ?? 0),
      operationsTotal: Number(snapshot.total?.operations ?? 0),
      operationsDelta: Number(snapshot.delta?.operations ?? 0),
      dataTransferTotal: Number(snapshot.total?.transfer ?? 0),
      dataTransferDelta: Number(snapshot.delta?.transfer ?? 0),
    },
    components,
    topConsumers: [...components].sort((a, b) => b.creditsDelta - a.creditsDelta).slice(0, 10),
    wasteSignals: [],
    savings: [],
    deferredWork: components.filter(component => component.runDecision === 'BUDGET_DEFERRED'),
    contract: {
      teamContract: 'TEAM-CONTRACT-v1.5-BRAIN-MISSIONS',
      brainSchemaVersion: 'brain.v1',
      bg167Watermark: snapshot.bg167_watermark ?? '',
      snapshotFingerprint: snapshot.fingerprint ?? `${snapshot.v ?? 'BG159'}|${snapshot.date ?? ''}`,
    },
  };
}

export function createNotionCostProjectionSource({ fetchImpl = fetch, token = process.env.NOTION_TOKEN, dataSourceId = COST_DATA_SOURCE_ID } = {}) {
  return Object.freeze({
    async get() {
      if (!token || !dataSourceId) return null;
      const response = await fetchImpl(`https://api.notion.com/v1/data_sources/${dataSourceId}/query`, {
        method: 'POST',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          'notion-version': '2025-09-03',
        },
        body: JSON.stringify({
          filter: { property: 'Experiment', title: { starts_with: 'Powerhouse Cost Snapshot' } },
          sorts: [{ property: 'Startdatum', direction: 'descending' }],
          page_size: 1,
        }),
      });
      if (!response.ok) return null;
      const result = await response.json();
      const page = result.results?.[0];
      if (!page) return null;
      let snapshot;
      try { snapshot = JSON.parse(textValue(page.properties?.Bewijs)); } catch { return null; }
      return recordFromSnapshot(snapshot, page.properties?.Startdatum?.date?.start ?? null);
    },
  });
}

export function createCostProjectionStore(store = getStore({ name: STORE_NAME, consistency: 'strong' }), notionSource = createNotionCostProjectionSource()) {
  return Object.freeze({
    async get() {
      const [blobRecord, notionRecord] = await Promise.all([
        store.get(STORE_KEY, { type: 'json', consistency: 'strong' }),
        notionSource.get(),
      ]);
      if (!blobRecord) return notionRecord;
      if (!notionRecord) return blobRecord;
      return new Date(notionRecord.sourceUpdatedAt).getTime() > new Date(blobRecord.sourceUpdatedAt).getTime() ? notionRecord : blobRecord;
    },
    async put(projection) {
      return store.setJSON(STORE_KEY, projection);
    },
  });
}

export { STORE_KEY as COST_PROJECTION_STORE_KEY };
