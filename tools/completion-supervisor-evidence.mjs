import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { computeExecutionIdentity } from './outcome-obligation-executor.mjs';
import { createSupabaseOutcomeObligationStores } from './outcome-obligation-supabase-store.mjs';
import { loadCanonicalObligations } from './outcome-obligation-runtime.mjs';

function text(value) { return typeof value === 'string' ? value.trim() : ''; }
function sha(value, name, optional = false) {
  const normalized = text(value).toLowerCase();
  if (optional && !normalized) return '';
  if (!/^[0-9a-f]{40}$/.test(normalized)) throw new TypeError(`${name} must be a 40-character Git SHA`);
  return normalized;
}

function record({ type, producer, ref, obligationId, candidateIdentity, productionIdentity = null, exactProduction = false }) {
  return Object.freeze({ type, producer, ref, taskIdentity:obligationId, candidateIdentity, productionIdentity, independent:true, accepted:true, exactProduction });
}

export function deriveTrustedCompletionEvidence(input = {}) {
  const conclusion = text(input.conclusion).toLowerCase();
  if (conclusion !== 'success') return Object.freeze([]);
  const sourceWorkflow = text(input.sourceWorkflow);
  const obligationId = text(input.obligationId);
  const candidateIdentity = sha(input.candidateIdentity, 'candidateIdentity');
  const productionIdentity = sha(input.productionIdentity, 'productionIdentity', true);
  const runRef = `github-run:${text(input.runId) || 'unknown'}`;
  const evidence = [];

  if (sourceWorkflow === 'Unified Brain Delivery') {
    evidence.push(record({ type:'CANDIDATE_TESTS', producer:'BRAIN_DELIVERY', ref:`${runRef}:candidate-tests`, obligationId, candidateIdentity }));
    if (input.bg169) {
      const artifactCandidate = sha(input.bg169.candidate_sha, 'bg169.candidate_sha');
      const expectedHead = sha(input.bg169.expected_head_sha, 'bg169.expected_head_sha');
      const artifactProduction = sha(input.bg169.production_sha, 'bg169.production_sha');
      if (input.bg169.authority !== 'BG169' || input.bg169.execution_proof !== true || input.bg169.verified !== true
        || artifactCandidate !== candidateIdentity || expectedHead !== candidateIdentity) throw new Error('BG169 identity or execution proof mismatch');
      if (productionIdentity && productionIdentity !== artifactProduction) throw new Error('BG169 production identity mismatch');
      evidence.push(
        record({ type:'PROTECTED_DELIVERY', producer:'BG169', ref:`${runRef}:protected-delivery`, obligationId, candidateIdentity, productionIdentity:artifactProduction, exactProduction:true }),
        record({ type:'PRODUCTION_IDENTITY', producer:'BG169', ref:`${runRef}:production-identity`, obligationId, candidateIdentity, productionIdentity:artifactProduction, exactProduction:true }),
      );
    }
  } else if (sourceWorkflow === 'Production Release Readback') {
    if (!productionIdentity) throw new Error('production identity is required for production readback');
    if (!input.readback || input.readback.status !== 'LIVE_VERIFIED' || input.readback.routes_ok !== true) throw new Error('production readback is not LIVE_VERIFIED');
    if (sha(input.readback.merge_sha, 'readback.merge_sha') !== productionIdentity) throw new Error('production identity mismatch');
    evidence.push(
      record({ type:'PROTECTED_DELIVERY', producer:'PRODUCTION_READBACK', ref:`${runRef}:protected-delivery`, obligationId, candidateIdentity, productionIdentity, exactProduction:true }),
      record({ type:'PRODUCTION_IDENTITY', producer:'PRODUCTION_READBACK', ref:`${runRef}:production-identity`, obligationId, candidateIdentity, productionIdentity, exactProduction:true }),
      record({ type:'FUNCTIONAL_READBACK', producer:'PRODUCTION_READBACK', ref:`${runRef}:functional-readback`, obligationId, candidateIdentity, productionIdentity, exactProduction:true }),
    );
    if (input.capabilityHandoff === true) evidence.push(record({ type:'CAPABILITY_HANDOFF', producer:'BG167', ref:`${runRef}:capability-handoff`, obligationId, candidateIdentity, productionIdentity, exactProduction:true }));
    if (input.learningWriteback === true) evidence.push(record({ type:'LEARNING_WRITEBACK', producer:'BG168_BG166', ref:`${runRef}:learning-writeback`, obligationId, candidateIdentity, productionIdentity, exactProduction:true }));
  }
  return Object.freeze(evidence);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key === '--capability-handoff' || key === '--learning-writeback') out[key.slice(2)] = true;
    else if (key.startsWith('--') && argv[i + 1]) { out[key.slice(2)] = argv[i + 1]; i += 1; }
    else throw new TypeError(`unknown or incomplete CLI argument: ${key}`);
  }
  return out;
}

async function optionalJson(path) {
  if (!path) return null;
  try { return JSON.parse(await readFile(path, 'utf8')); } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
}

export async function runCompletionEvidenceCli(argv = process.argv.slice(2), { env = process.env, fetchImpl = globalThis.fetch, now = new Date() } = {}) {
  const args = parseArgs(argv);
  const obligations = await loadCanonicalObligations();
  const obligation = obligations.find(item => item.id === args.obligation);
  if (!obligation) throw new Error(`unknown obligation id: ${args.obligation}`);
  const bg169 = await optionalJson(args.bg169);
  const readback = await optionalJson(args.readback);
  const productionIdentity = args.production || bg169?.production_sha || '';
  const evidence = deriveTrustedCompletionEvidence({
    sourceWorkflow:args.workflow,
    conclusion:args.conclusion,
    runId:args['run-id'],
    obligationId:obligation.id,
    candidateIdentity:args.candidate,
    productionIdentity,
    bg169,
    readback,
    capabilityHandoff:args['capability-handoff'] === true,
    learningWriteback:args['learning-writeback'] === true,
  });
  const identity = computeExecutionIdentity({ obligation, now, trigger:{ type:'event-trigger', fingerprint:args.fingerprint || `workflow:${args['run-id']}` }, coalesceKey:args['coalesce-key'] });
  const stores = createSupabaseOutcomeObligationStores({ url:env.SUPABASE_URL, token:env.SUPABASE_SERVICE_ROLE_KEY, fetchImpl });
  for (const item of evidence) await stores.evidenceStore.putIfAbsent({ idempotencyKey:identity.idempotencyKey, ...item });
  return Object.freeze({ idempotencyKey:identity.idempotencyKey, productionIdentity:productionIdentity || null, evidence });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCompletionEvidenceCli().then(result => console.log(JSON.stringify(result, null, 2))).catch(error => { console.error(error?.stack || error); process.exitCode = 1; });
}
