import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DEFAULT_CONTRACT = 'config/brain-chat-learning-contract.json';
const MANDATORY_SUPPLEMENTAL_SOURCES = [
  'brain/policies/chat-to-brain-completeness-v1.json',
  'brain/learning/chat-continuity-2026-08-31.json',
  'brain/learning/chat-materialization-2026-08-31-v2.json',
  'brain/learning/chat-materialization-2026-08-31-v3.json',
  'brain/learning/chat-runtime-truth-preflight-2026-08-31.json',
  'brain/learning/chat-error-completeness-preflight-v1.json'
];

function normalizeSourcePath(rootDir, sourcePath) {
  if (typeof sourcePath !== 'string' || !sourcePath.trim()) throw new Error('invalid learning source path');
  const normalized = sourcePath.replaceAll('\\', '/').replace(/^\.\//, '');
  const absolute = path.resolve(rootDir, normalized);
  const root = path.resolve(rootDir) + path.sep;
  if (absolute !== path.resolve(rootDir) && !absolute.startsWith(root)) throw new Error(`learning source escapes rootDir: ${sourcePath}`);
  return { normalized, absolute };
}

function stableUnique(values) {
  return [...new Set(values.filter(value => typeof value === 'string' && value.trim()).map(value => value.trim()))];
}

function collectSignals(value, signals, parentKey = '') {
  if (Array.isArray(value)) {
    for (const item of value) collectSignals(item, signals, parentKey);
    return;
  }
  if (!value || typeof value !== 'object') return;

  if (typeof value.fingerprint === 'string') signals.fingerprints.push(value.fingerprint);
  if (parentKey === 'fingerprints' && typeof value.id === 'string') signals.fingerprints.push(value.id);
  if (typeof value.prevention === 'string') signals.preventions.push(value.prevention);
  if (typeof value.prevent === 'string') signals.preventions.push(value.prevent);
  if (typeof value.state === 'string' && /(BLOCKED|UNRESOLVED|PAUSED|HARD_BOUNDARY)/i.test(value.state)) {
    signals.blockers.push(value.state);
  }
  if (typeof value.resume_contract === 'string') signals.resumeContracts.push(value.resume_contract);
  if (Array.isArray(value.resume_contract)) signals.resumeContracts.push(...value.resume_contract.filter(item => typeof item === 'string'));

  for (const [key, child] of Object.entries(value)) collectSignals(child, signals, key);
}

function serializedPacketBytes(packet) {
  let bytes = 0;
  let candidate = { ...packet, totalBytes: 0 };
  for (let i = 0; i < 3; i += 1) {
    bytes = Buffer.byteLength(JSON.stringify(candidate), 'utf8');
    candidate = { ...packet, totalBytes: bytes };
  }
  return bytes;
}

export function compileChatLearningPreflight({
  rootDir = process.cwd(),
  contractPath = DEFAULT_CONTRACT,
  maxSources = 32,
  maxBytes = 256_000
} = {}) {
  if (!Number.isInteger(maxSources) || maxSources < 1) throw new Error('maxSources must be a positive integer');
  if (!Number.isInteger(maxBytes) || maxBytes < 1) throw new Error('maxBytes must be a positive integer');

  const contractLocation = normalizeSourcePath(rootDir, contractPath);
  if (!fs.existsSync(contractLocation.absolute)) throw new Error(`missing chat-learning contract: ${contractPath}`);
  const contractRaw = fs.readFileSync(contractLocation.absolute, 'utf8');
  const contract = JSON.parse(contractRaw);
  if (contract.preflightRequired !== true || contract.newAgentsMustReadBeforeExecution !== true) {
    throw new Error('chat-learning preflight contract is not mandatory');
  }
  if (!Array.isArray(contract.canonicalSources) || contract.canonicalSources.length === 0) {
    throw new Error('chat-learning contract has no canonicalSources');
  }

  const queue = stableUnique([...contract.canonicalSources, ...MANDATORY_SUPPLEMENTAL_SOURCES]);
  const queued = new Set(queue);
  const visited = new Set();
  const sources = [];
  const signals = { fingerprints: [], preventions: [], blockers: [], resumeContracts: [] };
  let sourceBytes = Buffer.byteLength(contractRaw, 'utf8');

  while (queue.length) {
    const requested = queue.shift();
    const { normalized, absolute } = normalizeSourcePath(rootDir, requested);
    if (visited.has(normalized)) continue;
    if (visited.size + 1 > maxSources) throw new Error(`maxSources exceeded: ${visited.size + 1} > ${maxSources}`);
    if (!fs.existsSync(absolute)) throw new Error(`missing learning source: ${normalized}`);

    const raw = fs.readFileSync(absolute, 'utf8');
    const bytes = Buffer.byteLength(raw, 'utf8');
    sourceBytes += bytes;

    let parsed = null;
    if (normalized.endsWith('.json')) {
      try {
        parsed = JSON.parse(raw);
      } catch (error) {
        throw new Error(`invalid JSON learning source ${normalized}: ${error.message}`);
      }
      collectSignals(parsed, signals);
      if (Array.isArray(parsed.linked_learning_sources)) {
        for (const linked of parsed.linked_learning_sources) {
          if (typeof linked !== 'string' || !linked.trim()) throw new Error(`invalid linked_learning_sources entry in ${normalized}`);
          if (!queued.has(linked) && !visited.has(linked)) {
            queue.push(linked);
            queued.add(linked);
          }
        }
      }
    }

    sources.push({
      path: normalized,
      format: normalized.endsWith('.json') ? 'json' : 'text',
      bytes,
      sha256: crypto.createHash('sha256').update(raw).digest('hex'),
      type: parsed?.type ?? null,
      version: parsed?.version ?? null,
      fingerprint: parsed?.fingerprint ?? null
    });
    visited.add(normalized);
  }

  const packet = {
    version: 'BRAIN-CHAT-LEARNING-PREFLIGHT-v1',
    status: 'READY',
    contract: contractPath,
    sourceBytes,
    sources,
    fingerprints: stableUnique(signals.fingerprints).sort(),
    preventions: stableUnique(signals.preventions).sort(),
    blockers: stableUnique(signals.blockers).sort(),
    resume_contracts: stableUnique(signals.resumeContracts)
  };
  const totalBytes = serializedPacketBytes(packet);
  if (totalBytes > maxBytes) throw new Error(`maxBytes exceeded: ${totalBytes} > ${maxBytes}`);
  return { ...packet, totalBytes };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try {
    const packet = compileChatLearningPreflight();
    process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`CHAT_LEARNING_PREFLIGHT_FAILED: ${error.message}\n`);
    process.exitCode = 1;
  }
}
