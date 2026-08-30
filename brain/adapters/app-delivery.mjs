export const SUPPORTED_APP_TARGETS = Object.freeze(new Set(['notion', 'make', 'supabase', 'dataforseo']));

const REQUIRED_GATES = Object.freeze(['contract', 'quality', 'security', 'cost_performance', 'preview']);

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') return 'delivery manifest is required';
  if (manifest.contract !== 'BRAIN-DELIVERY-v2') return 'BRAIN-DELIVERY-v2 contract is required';
  if (!nonEmpty(manifest.change_id)) return 'change_id is required';
  if (!nonEmpty(manifest.component_id)) return 'component_id is required';
  if (manifest.registered !== true) return 'component must be registered';
  if (manifest.brain_context_loaded !== true) return 'BRAIN context must be loaded';
  if (manifest.learning_writeback_configured !== true) return 'learning writeback must be configured';
  for (const gate of REQUIRED_GATES) {
    if (manifest.gates?.[gate] !== true) return `delivery gate ${gate} must be green`;
  }
  return null;
}

export function classifyAdapterError(error = {}) {
  const status = Number(error.status ?? error.statusCode ?? error.response?.status ?? 0);
  if (status === 401 || status === 403) return 'AUTH';
  if (status === 400 || status === 404 || status === 405 || status === 415 || status === 422) return 'VALIDATION';
  if (status === 408 || status === 425 || status === 429 || status >= 500) return 'TRANSIENT';
  if (error.code === 'POLICY' || error.name === 'PolicyError') return 'POLICY';
  return 'REMOTE';
}

function normalizeRemoteResult(result = {}) {
  const status = Number(result.status ?? 0);
  return {
    status,
    ok: result.ok === true || (status >= 200 && status < 300),
    remote_ref: result.remote_ref ?? result.body?.id ?? result.body?.request_id ?? '',
  };
}

function createMemoryIdempotencyStore() {
  const completed = new Map();
  return {
    async get(key) { return completed.get(key); },
    async put(key, value) { completed.set(key, value); },
  };
}

export function createAppDeliveryAdapter({ target, invoke, writeEvidence = async () => {}, idempotencyStore } = {}) {
  if (!SUPPORTED_APP_TARGETS.has(target)) throw new TypeError(`Unsupported app delivery target: ${target}`);
  if (typeof invoke !== 'function') throw new TypeError('adapter invoke function is required');
  if (typeof writeEvidence !== 'function') throw new TypeError('writeEvidence must be a function');

  const store = idempotencyStore ?? createMemoryIdempotencyStore();
  if (typeof store.get !== 'function' || typeof store.put !== 'function') throw new TypeError('idempotencyStore requires get and put');

  return Object.freeze({
    target,
    async deliver({ manifest, payload, idempotency_key: idempotencyKey } = {}) {
      const policyError = validateManifest(manifest);
      if (policyError) {
        return Object.freeze({ ok: false, target, error_class: 'POLICY', reason: policyError, deduplicated: false });
      }
      if (!nonEmpty(idempotencyKey)) {
        return Object.freeze({ ok: false, target, error_class: 'VALIDATION', reason: 'idempotency_key is required', deduplicated: false });
      }

      const existing = await store.get(idempotencyKey);
      if (existing) return Object.freeze({ ...existing, deduplicated: true });

      const evidenceBase = {
        contract: 'BRAIN-DELIVERY-v2',
        target,
        change_id: manifest.change_id,
        component_id: manifest.component_id,
        idempotency_key: idempotencyKey,
      };

      try {
        const remote = normalizeRemoteResult(await invoke({ manifest, payload, idempotency_key: idempotencyKey }));
        if (!remote.ok) {
          const errorClass = classifyAdapterError({ status: remote.status });
          const failure = Object.freeze({ ok: false, target, status: remote.status, error_class: errorClass, reason: 'remote delivery rejected', deduplicated: false });
          await writeEvidence({ ...evidenceBase, status: 'RED', error_class: errorClass, remote_status: remote.status });
          return failure;
        }

        const success = Object.freeze({ ok: true, target, status: remote.status, remote_ref: remote.remote_ref, error_class: null, deduplicated: false });
        await store.put(idempotencyKey, success);
        await writeEvidence({ ...evidenceBase, status: 'GREEN', remote_status: remote.status, remote_ref: remote.remote_ref });
        return success;
      } catch (error) {
        const errorClass = classifyAdapterError(error);
        await writeEvidence({ ...evidenceBase, status: 'RED', error_class: errorClass, remote_status: Number(error?.status ?? 0) });
        return Object.freeze({ ok: false, target, error_class: errorClass, reason: String(error?.message ?? 'remote delivery failed'), deduplicated: false });
      }
    },
  });
}

export function createCanonicalAppAdapters({ notion, make, supabase, dataforseo, writeEvidence, idempotencyStore } = {}) {
  const invokers = { notion, make, supabase, dataforseo };
  return Object.freeze(Object.fromEntries(
    [...SUPPORTED_APP_TARGETS].map(target => [target, createAppDeliveryAdapter({
      target,
      invoke: invokers[target],
      writeEvidence,
      idempotencyStore,
    })]),
  ));
}
