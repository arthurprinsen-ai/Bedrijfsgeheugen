import { parseDeliveryMetadata } from './delivery-hygiene.mjs';

const CANDIDATE_VERSION = 'POWERHOUSE-DELIVERY-CANDIDATE-v1';
const SHA40 = /^[0-9a-f]{40}$/i;

function normalize(value) {
  return String(value ?? '').trim();
}

function normalizePath(value) {
  return normalize(value).replace(/^\.\//, '');
}

function parsePrScope(body = '') {
  const result = { delivery: parseDeliveryMetadata(body) };
  for (const rawLine of String(body).split(/\r?\n/)) {
    const line = rawLine.trim();
    const scope = line.match(/^Change-Scope:\s*(.+)$/i);
    if (scope) result.expectedPaths = scope[1].split(',').map(normalizePath).filter(Boolean);
    const budget = line.match(/^Scope-Budget:\s*(\d+)$/i);
    if (budget) result.maxFiles = Number(budget[1]);
  }
  return result;
}

function normalizeManifest(manifest = {}) {
  const delivery = Object.freeze({
    obligationId: normalize(manifest.obligationId),
    deliveryLane: normalize(manifest.deliveryLane).toLowerCase(),
    candidateType: normalize(manifest.candidateType).toLowerCase(),
    baseSha: normalize(manifest.baseSha).toLowerCase(),
    supersedes: manifest.supersedes ?? null,
  });
  const expectedPaths = Array.isArray(manifest.expectedPaths)
    ? manifest.expectedPaths.map(normalizePath).filter(Boolean)
    : [];
  const maxFiles = Number(manifest.maxFiles);
  const errors = [];
  if (manifest.version !== CANDIDATE_VERSION) errors.push('VERSION_INVALID');
  if (!delivery.obligationId) errors.push('OBLIGATION_ID_MISSING');
  if (!delivery.deliveryLane) errors.push('DELIVERY_LANE_MISSING');
  if (!delivery.candidateType) errors.push('CANDIDATE_TYPE_MISSING');
  if (!SHA40.test(delivery.baseSha)) errors.push('BASE_SHA_INVALID');
  if (!expectedPaths.length) errors.push('EXPECTED_PATHS_MISSING');
  if (!Number.isInteger(maxFiles) || maxFiles < 1) errors.push('MAX_FILES_INVALID');
  if (errors.length) throw new Error(`DELIVERY_CANDIDATE_MANIFEST_INVALID:${errors.join(',')}`);
  return Object.freeze({ delivery, expectedPaths: Object.freeze(expectedPaths), maxFiles });
}

export function resolveDeliveryMetadataAuthority({ prBody = '', manifest = null } = {}) {
  const fallback = parsePrScope(prBody);
  if (!manifest) return Object.freeze({ source: 'pr-body', ...fallback });
  const versioned = normalizeManifest(manifest);
  if (fallback.delivery.obligationId !== versioned.delivery.obligationId) {
    return Object.freeze({ source: 'pr-body', ...fallback });
  }
  return Object.freeze({
    source: 'versioned-manifest',
    ...versioned,
    prBodyDrift: Object.freeze({
      baseSha: fallback.delivery.baseSha !== versioned.delivery.baseSha,
      obligationId: fallback.delivery.obligationId !== versioned.delivery.obligationId,
      deliveryLane: fallback.delivery.deliveryLane !== versioned.delivery.deliveryLane,
      candidateType: fallback.delivery.candidateType !== versioned.delivery.candidateType,
      expectedPaths: JSON.stringify(fallback.expectedPaths ?? []) !== JSON.stringify(versioned.expectedPaths),
      maxFiles: fallback.maxFiles !== versioned.maxFiles,
    }),
  });
}
