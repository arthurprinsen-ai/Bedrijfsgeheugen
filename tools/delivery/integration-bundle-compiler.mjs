import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { parseDeliveryMetadata } from './delivery-hygiene.mjs';
import { createAdaptiveDeliveryPlan, loadAdaptiveDeliveryPolicy } from './adaptive-delivery-engine.mjs';
import { derivePatternMemoryRoute, loadLearningRecords } from './delivery-pattern-memory.mjs';

const SHA40 = /^[0-9a-f]{40}$/i;

function unique(values = []) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))].sort();
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
}

function hash(value) {
  return createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
}

function matchesPrefix(path, patterns = []) {
  return patterns.some(pattern => path === pattern || path.startsWith(pattern));
}

function requireSha(value, code) {
  const normalized = String(value || '').trim().toLowerCase();
  if (!SHA40.test(normalized)) throw new Error(code);
  return normalized;
}

export function compileClosurePlan({ changedPaths = [], policy } = {}) {
  const paths = unique(changedPaths);
  const closureOnly = policy?.closureOnly || [];
  const materialPaths = paths.filter(path => !matchesPrefix(path, closureOnly));
  const material = materialPaths.length > 0;
  const evidence = {};
  const missing = [];
  for (const [id, patterns] of Object.entries(policy?.closureArtifacts || {})) {
    evidence[id] = paths.filter(path => matchesPrefix(path, patterns));
    if (material && evidence[id].length === 0) missing.push(id);
  }
  return Object.freeze({
    material,
    materialPaths: Object.freeze(materialPaths),
    evidence: Object.freeze(evidence),
    missing: Object.freeze(missing.sort()),
    ready: missing.length === 0
  });
}

export function compilePrContract({ metadata = {}, changedPaths = [], maxFiles = null } = {}) {
  const paths = unique(changedPaths);
  const budget = Number.isInteger(maxFiles) && maxFiles > 0 ? maxFiles : paths.length;
  const lines = [
    `Obligation-ID: ${metadata.obligationId || ''}`,
    `Delivery-Lane: ${metadata.deliveryLane || ''}`,
    `Candidate-Type: ${metadata.candidateType || ''}`,
    `Base-SHA: ${metadata.baseSha || ''}`,
    `Change-Scope: ${paths.join(', ')}`,
    `Scope-Budget: ${budget}`
  ];
  if (metadata.supersedes !== null && metadata.supersedes !== undefined) {
    lines.splice(4, 0, `Supersedes: ${metadata.supersedes}`);
  }
  return Object.freeze({ lines: Object.freeze(lines), text: lines.join('\n') });
}

export function compileIntegrationBundle({
  changedPaths = [],
  metadata = {},
  baseSha,
  headSha,
  prNumber = null,
  adaptivePolicy,
  integrationPolicy,
  learningRecords = []
} = {}) {
  if (!integrationPolicy || integrationPolicy.version !== 'POWERHOUSE-INTEGRATION-BUNDLE-v1') {
    throw new TypeError('POWERHOUSE-INTEGRATION-BUNDLE-v1 policy is required');
  }
  const normalizedBase = requireSha(baseSha, 'INVALID_BASE_SHA');
  const normalizedHead = requireSha(headSha, 'INVALID_HEAD_SHA');
  const paths = unique(changedPaths);
  const adaptiveBase = createAdaptiveDeliveryPlan({ changedPaths: paths, policy: adaptivePolicy });
  const patternMemory = derivePatternMemoryRoute({ changedPaths: paths, learningRecords });
  const adaptive = Object.freeze({
    ...adaptiveBase,
    tests: Object.freeze(unique([...(adaptiveBase.tests || []), ...(patternMemory.tests || [])]))
  });
  const closure = compileClosurePlan({ changedPaths: paths, policy: integrationPolicy });
  const canonicalMetadata = Object.freeze({
    obligationId: String(metadata.obligationId || '').trim(),
    deliveryLane: String(metadata.deliveryLane || '').trim().toLowerCase(),
    candidateType: String(metadata.candidateType || '').trim().toLowerCase(),
    baseSha: String(metadata.baseSha || normalizedBase).trim().toLowerCase(),
    supersedes: metadata.supersedes ?? null
  });
  const prContract = compilePrContract({ metadata: canonicalMetadata, changedPaths: paths, maxFiles: paths.length });
  const writerIntent = canonicalMetadata.obligationId
    ? Object.freeze({
        mode: integrationPolicy.writer.mode,
        owner: integrationPolicy.writer.owner,
        maxTerminalWritersPerObligation: integrationPolicy.writer.maxTerminalWritersPerObligation,
        obligationId: canonicalMetadata.obligationId,
        exactHeadSha: normalizedHead,
        mainEpoch: integrationPolicy.writer.mainEpoch,
        leaseScope: canonicalMetadata.obligationId
      })
    : Object.freeze({
        mode: 'NO_PR_WRITER_INTENT',
        owner: null,
        maxTerminalWritersPerObligation: 0,
        obligationId: null,
        exactHeadSha: normalizedHead,
        mainEpoch: null,
        leaseScope: null
      });

  const core = {
    version: integrationPolicy.version,
    candidate: {
      prNumber: prNumber === null || prNumber === '' ? null : Number(prNumber),
      baseSha: normalizedBase,
      headSha: normalizedHead,
      metadata: canonicalMetadata,
      changedPaths: paths
    },
    adaptive,
    patternMemory,
    closure,
    prContract,
    writerIntent
  };
  return Object.freeze({ ...core, bundleHash: hash(core) });
}

function argValue(args, name, fallback = '') {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

async function main() {
  const args = process.argv.slice(2);
  const base = argValue(args, '--base', 'HEAD^');
  const head = argValue(args, '--head', 'HEAD');
  const baseSha = execFileSync('git', ['rev-parse', base], { encoding: 'utf8' }).trim();
  const headSha = execFileSync('git', ['rev-parse', head], { encoding: 'utf8' }).trim();
  const changedPaths = execFileSync('git', ['diff', '--name-only', `${baseSha}...${headSha}`], { encoding: 'utf8' })
    .split(/\r?\n/).filter(Boolean);
  const adaptivePolicy = await loadAdaptiveDeliveryPolicy();
  const integrationPolicy = JSON.parse(await readFile('config/powerhouse-integration-bundle-v1.json', 'utf8'));
  const learningRecords = await loadLearningRecords();
  const metadata = parseDeliveryMetadata(process.env.PR_BODY || '');
  const bundle = compileIntegrationBundle({
    changedPaths,
    metadata,
    baseSha,
    headSha,
    prNumber: process.env.PR_NUMBER || null,
    adaptivePolicy,
    integrationPolicy,
    learningRecords
  });
  await mkdir('.artifacts', { recursive: true });
  const artifactPath = '.artifacts/powerhouse-integration-bundle.json';
  await writeFile(artifactPath, `${JSON.stringify(bundle, null, 2)}\n`);
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT,
      `risk=${bundle.adaptive.risk}\n` +
      `full_shared_suite=${bundle.adaptive.fullSharedSuite}\n` +
      `hot=${bundle.adaptive.hot}\n` +
      `tests_json=${JSON.stringify(bundle.adaptive.tests)}\n` +
      `capabilities_json=${JSON.stringify(bundle.adaptive.capabilities)}\n` +
      `closure_ready=${bundle.closure.ready}\n` +
      `bundle_hash=${bundle.bundleHash}\n` +
      `bundle_path=${artifactPath}\n` +
      `writer_mode=${bundle.writerIntent.mode}\n` +
      `writer_owner=${bundle.writerIntent.owner || ''}\n`
    );
  }
  process.stdout.write(`${JSON.stringify(bundle)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    process.stderr.write(`${JSON.stringify({ ok: false, error: error.message })}\n`);
    process.exitCode = 1;
  });
}
