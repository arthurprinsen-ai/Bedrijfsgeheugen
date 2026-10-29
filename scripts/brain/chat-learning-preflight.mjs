import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildExecutionPacketV2, classifyTask } from './powerhouse-fast-execution.mjs';
import { buildSkillProjectionIndex, verifySkillProjectionIndex, selectSkillProjection, buildSkillSourceManifest, selectSkillSourceManifest } from './powerhouse-skill-projection.mjs';

const DEFAULT_CONTRACT = 'config/brain-chat-learning-contract.json';
const LEGACY_FAST_EXECUTION_POLICY_SOURCE = 'config/powerhouse-fast-execution-v1.json';
const FAST_DEVELOPMENT_V2_SOURCE = 'config/powerhouse-fast-development-protocol-v2.json';
const FAST_DEVELOPMENT_V2_ENTRYPOINT = 'scripts/brain/powerhouse-fast-execution.mjs';
const UNIVERSAL_COMPLETION_POLICY_SOURCE = 'config/powerhouse-universal-completion-v1.json';
const UNIVERSAL_INGRESS_POLICY_SOURCE = 'config/powerhouse-universal-ingress-v1.json';
const SKILL_PROJECTION_INDEX_SOURCE = 'brain/skills/powerhouse-learning-skill-index-v1.json';
const INCIDENT_SELF_FIX_POLICY_SOURCE = 'brain/policies/powerhouse-incident-register-and-self-fix-v1.json';
const MANDATORY_SUPPLEMENTAL_SOURCES = [
  'config/branch-delivery-ownership-guard.json',
  'config/powerhouse-engineering-os.json',
  'config/powerhouse-truth-status-contract.json',
  'config/powerhouse-execution-resilience-v1.json',
  FAST_DEVELOPMENT_V2_SOURCE,
  LEGACY_FAST_EXECUTION_POLICY_SOURCE,
  UNIVERSAL_COMPLETION_POLICY_SOURCE,
  UNIVERSAL_INGRESS_POLICY_SOURCE,
  'brain/policies/powerhouse-system-contract-v1.json',
  'brain/policies/live-completion-learning-contract-v1.json',
  'brain/policies/powerhouse-agent-continuity-v1.json',
  'brain/policies/powerhouse-universal-agent-learning-writeback-v1.json',
  INCIDENT_SELF_FIX_POLICY_SOURCE,
  'brain/contracts/resource-intelligence-v1.json',
  'docs/brain/learning-plane-authority-contract-v1.md',
  'brain/policies/chat-to-brain-completeness-v1.json',
  'brain/learning/chat-continuity-2026-08-31.json',
  'brain/learning/chat-materialization-2026-08-31-v2.json',
  'brain/learning/chat-materialization-2026-08-31-v3.json',
  'brain/learning/chat-runtime-truth-preflight-2026-08-31.json',
  'brain/learning/homepage-video-release-preflight-2026-09-08.json'
];
const DEFAULT_MAX_SOURCES = 128;
const DEFAULT_MAX_BYTES = 256_000;
const EXPECTED_FLOW = ['INTENT','EXECUTION_PACKET_V2','NO_OP_DEDUP','IMPACT_GRAPH','EXECUTION_DAG','TARGETED_TESTS','CANDIDATE','FULL_RELEASE_GATES','EXACT_SHA_PROD_READBACK','DELTA_WRITEBACK'];
const EXPECTED_CLASSES = ['FAST','STANDARD','CRITICAL','WAITING_EXTERNAL'];

function nowMs() { return Number(process.hrtime.bigint()) / 1_000_000; }

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
  if (Array.isArray(value)) { for (const item of value) collectSignals(item, signals, parentKey); return; }
  if (!value || typeof value !== 'object') return;
  if (typeof value.fingerprint === 'string') signals.fingerprints.push(value.fingerprint);
  if (parentKey === 'fingerprints' && typeof value.id === 'string') signals.fingerprints.push(value.id);
  if (typeof value.prevention === 'string') signals.preventions.push(value.prevention);
  if (typeof value.prevent === 'string') signals.preventions.push(value.prevent);
  if (typeof value.state === 'string' && /(BLOCKED|UNRESOLVED|PAUSED|HARD_BOUNDARY)/i.test(value.state)) signals.blockers.push(value.state);
  if (typeof value.resume_contract === 'string') signals.resumeContracts.push(value.resume_contract);
  if (Array.isArray(value.resume_contract)) signals.resumeContracts.push(...value.resume_contract.filter(item => typeof item === 'string'));
  for (const [key, child] of Object.entries(value)) collectSignals(child, signals, key);
}

function serializedPacketBytes(packet) {
  let bytes = 0;
  let candidate = { ...packet, totalBytes: 0 };
  for (let i = 0; i < 3; i += 1) { bytes = Buffer.byteLength(JSON.stringify(candidate), 'utf8'); candidate = { ...packet, totalBytes: bytes }; }
  return bytes;
}

function validateLegacyFastExecutionPolicy(policy) {
  if (!policy || policy.type !== 'POWERHOUSE_FAST_EXECUTION_POLICY') throw new Error('legacy fast-execution policy missing or wrong type');
  if (policy.version !== 'POWERHOUSE-FAST-EXECUTION-v1') throw new Error(`unsupported legacy fast-execution policy version: ${policy.version ?? 'missing'}`);
  if (policy.status !== 'ACTIVE' || policy.default_enabled !== true) throw new Error('legacy fast-execution compatibility policy is not active/default enabled');
  if (typeof policy.entrypoint !== 'string' || !policy.entrypoint) throw new Error('legacy fast-execution entrypoint is missing');
  return Object.freeze({ version: policy.version, status: policy.status, defaultEnabled: policy.default_enabled, policySource: LEGACY_FAST_EXECUTION_POLICY_SOURCE, entrypoint: policy.entrypoint, compatibilityOnly: true });
}

function validateFastDevelopmentV2(policy) {
  if (!policy || policy.fingerprint !== 'powerhouse-fast-development-protocol-v2') throw new Error('Fast Development Protocol v2 fingerprint drift');
  if (policy.status !== 'active') throw new Error('Fast Development Protocol v2 is not active');
  if (policy.creates_parallel_authority !== false) throw new Error('Fast Development Protocol v2 may not create parallel authority');
  if (JSON.stringify(policy.canonical_flow) !== JSON.stringify(EXPECTED_FLOW)) throw new Error('Fast Development Protocol v2 canonical flow drift');
  if (JSON.stringify(policy.execution_classes) !== JSON.stringify(EXPECTED_CLASSES)) throw new Error('Fast Development Protocol v2 execution classes drift');
  if (policy.preflight?.no_op_before_reasoning !== true) throw new Error('Fast Development Protocol v2 no-op-before-reasoning drift');
  if (policy.testing?.full_release_gates_at_promotion_boundary !== true) throw new Error('Fast Development Protocol v2 release-boundary drift');
  if (policy.evidence_cache?.persistence_authority !== 'brain_outcome_obligation_evidence') throw new Error('Fast Development Protocol v2 evidence persistence authority drift');
  if (!policy.evidence_cache?.non_cacheable?.includes('EXACT_SHA_PROD_READBACK')) throw new Error('Fast Development Protocol v2 production readback must remain non-cacheable');
  return Object.freeze({
    fingerprint: policy.fingerprint,
    version: policy.version,
    status: policy.status,
    executionClasses: [...policy.execution_classes],
    canonicalFlow: [...policy.canonical_flow],
    noOpBeforeReasoning: true,
    fullReleaseGatesAtPromotionBoundary: true,
    persistenceAuthority: policy.evidence_cache.persistence_authority,
    entrypoint: FAST_DEVELOPMENT_V2_ENTRYPOINT,
    failClosed: true
  });
}

function validateUniversalCompletionPolicy(policy) {
  if (!policy || policy.type !== 'POWERHOUSE_UNIVERSAL_COMPLETION_POLICY') throw new Error('universal-completion policy missing or wrong type');
  if (policy.version !== 'POWERHOUSE-UNIVERSAL-COMPLETION-v1') throw new Error(`unsupported universal-completion policy version: ${policy.version ?? 'missing'}`);
  if (policy.status !== 'ACTIVE' || policy.default_enabled !== true || policy.fail_closed !== true) throw new Error('universal-completion policy must be ACTIVE, default enabled and fail-closed');
  if (typeof policy.scope !== 'string' || !/chats/i.test(policy.scope) || !/agents/i.test(policy.scope)) throw new Error('universal-completion scope does not cover chats and agents');
  if (!Array.isArray(policy.required_categories) || policy.required_categories.length < 20) throw new Error('universal-completion required categories are incomplete');
  if (typeof policy.entrypoint !== 'string' || !policy.entrypoint) throw new Error('universal-completion entrypoint is missing');
  return Object.freeze({ version: policy.version, status: policy.status, defaultEnabled: policy.default_enabled, failClosed: policy.fail_closed, manifestVersion: policy.manifest_version, requiredCategories: [...policy.required_categories], policySource: UNIVERSAL_COMPLETION_POLICY_SOURCE, entrypoint: policy.entrypoint });
}

function validateUniversalIngressPolicy(policy) {
  if (!policy || policy.type !== 'POWERHOUSE_UNIVERSAL_INGRESS_POLICY') throw new Error('universal-ingress policy missing or wrong type');
  if (policy.version !== 'POWERHOUSE-UNIVERSAL-INGRESS-v1') throw new Error(`unsupported universal-ingress policy version: ${policy.version ?? 'missing'}`);
  if (policy.status !== 'ACTIVE' || policy.default_enabled !== true || policy.fail_closed !== true) throw new Error('universal-ingress policy must be ACTIVE, default enabled and fail-closed');
  if (typeof policy.scope !== 'string' || !/chats/i.test(policy.scope) || !/agents/i.test(policy.scope)) throw new Error('universal-ingress scope does not cover chats and agents');
  const requiredActorKinds = ['chat','agent','workflow','scheduled','portal','cockpit','edge_function','runtime'];
  if (!Array.isArray(policy.actor_kinds) || requiredActorKinds.some(kind => !policy.actor_kinds.includes(kind))) throw new Error('universal-ingress actor kinds are incomplete');
  if (typeof policy.runtime_entrypoint !== 'string' || !policy.runtime_entrypoint) throw new Error('universal-ingress runtime entrypoint is missing');
  if (typeof policy.completion_entrypoint !== 'string' || !policy.completion_entrypoint) throw new Error('universal-ingress completion entrypoint is missing');
  return Object.freeze({
    version: policy.version,
    status: policy.status,
    defaultEnabled: policy.default_enabled,
    failClosed: policy.fail_closed,
    actorKinds: [...policy.actor_kinds],
    policySource: UNIVERSAL_INGRESS_POLICY_SOURCE,
    runtimeEntrypoint: policy.runtime_entrypoint,
    completionEntrypoint: policy.completion_entrypoint
  });
}

export function evaluateIncidentSelfFix({ rootDir, policy }) {
  if (!policy || policy.type !== 'POWERHOUSE_INCIDENT_REGISTER_SELF_FIX_POLICY') throw new Error('incident self-fix policy missing or wrong type');
  if (policy.version !== 'POWERHOUSE-INCIDENT-REGISTER-SELF-FIX-v1') throw new Error(`unsupported incident self-fix policy version: ${policy.version ?? 'missing'}`);
  if (policy.fingerprint !== 'agents-skills-register-and-self-fix-v1') throw new Error('incident self-fix fingerprint drift');
  if (policy.status !== 'ACTIVE' || policy.default_enabled !== true || policy.fail_closed !== true) throw new Error('incident self-fix policy must be ACTIVE, default enabled and fail-closed');
  if (typeof policy.scope !== 'string' || !/agents/i.test(policy.scope) || !/skills/i.test(policy.scope)) throw new Error('incident self-fix scope does not cover agents and skills');
  const protocol = policy.skill_protocol ?? {};
  if (typeof protocol.marker !== 'string' || !protocol.marker) throw new Error('incident self-fix skill marker is missing');
  if (protocol.new_skills_must_carry_marker !== true) throw new Error('incident self-fix must require the marker on new skills');
  if (!Array.isArray(policy.reserved_for_owner) || policy.reserved_for_owner.length === 0) throw new Error('incident self-fix reserved owner decisions are missing');
  if (!Array.isArray(policy.loop_debt_baseline)) throw new Error('incident self-fix loop debt baseline is missing');
  const lean = policy.continuous_lean_loop;
  const expectedStages = ['MEASURE','ANALYZE','HYPOTHESIZE','PRIORITIZE','IMPLEMENT','VERIFY','LEARN','REMEASURE'];
  if (!lean || lean.required !== true) throw new Error('LEAN_LOOP_POLICY_MISSING');
  if (JSON.stringify(lean.stages) !== JSON.stringify(expectedStages)) throw new Error('LEAN_LOOP_STAGE_DRIFT');
  if (lean.one_authority_only !== true || lean.one_existing_heartbeat_cadence_only !== true || lean.exclusive_writer_per_obligation !== true) throw new Error('LEAN_LOOP_PARALLEL_AUTHORITY_FORBIDDEN');
  for (const key of ['cycle','event','memory','incident','improvement_candidate','data_source_registry','source_observations','site_measurements','commercial_outcomes']) {
    if (typeof lean.canonical_tables?.[key] !== 'string' || !lean.canonical_tables[key].startsWith('public.')) throw new Error('LEAN_LOOP_CANONICAL_AUTHORITY_MISSING:' + key);
  }
  if (!Array.isArray(lean.required_material_action_evidence) || lean.required_material_action_evidence.length < 12) throw new Error('LEAN_LOOP_EVIDENCE_INCOMPLETE');
  if (!Array.isArray(lean.daily_questions) || lean.daily_questions.length !== 4) throw new Error('LEAN_LOOP_QUESTIONS_INCOMPLETE');
  if (!Array.isArray(lean.hard_gates) || !lean.hard_gates.includes('NO_SUCCESS_WITHOUT_INDEPENDENT_OUTCOME_EVIDENCE')) throw new Error('LEAN_LOOP_PROOF_GATE_MISSING');
  if (typeof lean.data_gap_rule !== 'string' || !lean.data_gap_rule.includes('UNKNOWN is not ZERO')) throw new Error('LEAN_LOOP_MISSING_DATA_GUARD');

  const skillsRoot = normalizeSourcePath(rootDir, '.agents/skills');
  const names = fs.existsSync(skillsRoot.absolute)
    ? fs.readdirSync(skillsRoot.absolute).filter(name => fs.existsSync(path.join(skillsRoot.absolute, name, 'SKILL.md'))).sort()
    : [];
  const baseline = new Set(policy.loop_debt_baseline);
  const withProtocol = [];
  const loopDebt = [];
  const violations = [];
  for (const name of names) {
    const raw = fs.readFileSync(path.join(skillsRoot.absolute, name, 'SKILL.md'), 'utf8');
    if (raw.includes(protocol.marker)) { withProtocol.push(name); continue; }
    if (baseline.has(name)) loopDebt.push(name); else violations.push(name);
  }
  if (violations.length) throw new Error(`INCIDENT_PROTOCOL_MISSING_ON_NEW_SKILL:${violations.join(',')}`);
  const edgeProtocol = policy.edge_function_protocol;
  if (!edgeProtocol || edgeProtocol.marker !== protocol.marker || edgeProtocol.new_functions_must_carry_marker !== true || !Array.isArray(edgeProtocol.loop_debt_baseline)) throw new Error('INCIDENT_EDGE_PROTOCOL_POLICY_INVALID');
  const functionsRoot = normalizeSourcePath(rootDir, 'supabase/functions');
  const functionNames = fs.existsSync(functionsRoot.absolute)
    ? fs.readdirSync(functionsRoot.absolute).filter(name => name !== '_shared' && fs.existsSync(path.join(functionsRoot.absolute, name, 'index.ts'))).sort()
    : [];
  const edgeBaseline = new Set(edgeProtocol.loop_debt_baseline);
  const edgeWithProtocol = [];
  const edgeDebt = [];
  const edgeViolations = [];
  for (const name of functionNames) {
    const raw = fs.readFileSync(path.join(functionsRoot.absolute, name, 'index.ts'), 'utf8');
    if (raw.includes(edgeProtocol.marker)) { edgeWithProtocol.push(name); continue; }
    if (edgeBaseline.has(name)) edgeDebt.push(name); else edgeViolations.push(name);
  }
  if (edgeViolations.length) throw new Error(`INCIDENT_PROTOCOL_MISSING_ON_NEW_EDGE_FUNCTION:${edgeViolations.join(',')}`);
  return Object.freeze({
    fingerprint: policy.fingerprint,
    version: policy.version,
    status: policy.status,
    failClosed: true,
    policySource: INCIDENT_SELF_FIX_POLICY_SOURCE,
    marker: protocol.marker,
    lean_loop: Object.freeze({ required: true, stages: [...lean.stages], evidence_fields: [...lean.required_material_action_evidence], data_gap_rule: lean.data_gap_rule, limits: lean.enforcement_limit }),
    reservedForOwner: [...policy.reserved_for_owner],
    skills_total: names.length,
    skills_with_protocol: withProtocol.length,
    loop_debt: Object.freeze({ count: loopDebt.length, skills: loopDebt }),
    edge_functions: Object.freeze({ total: functionNames.length, with_protocol: edgeWithProtocol.length, loop_debt: Object.freeze({ count: edgeDebt.length, functions: edgeDebt }), limit: edgeProtocol.limit }),
    not_covered_yet: policy.enforcement?.not_covered_yet ?? null
  });
}

export function compileChatLearningPreflight({ rootDir = process.cwd(), contractPath = DEFAULT_CONTRACT, maxSources = null, maxBytes = null, executionContext = {} } = {}) {
  const preflightStarted = nowMs();
  const contractLocation = normalizeSourcePath(rootDir, contractPath);
  if (!fs.existsSync(contractLocation.absolute)) throw new Error(`missing chat-learning contract: ${contractPath}`);
  const contractRaw = fs.readFileSync(contractLocation.absolute, 'utf8');
  const contract = JSON.parse(contractRaw);
  const effectiveMaxSources = Number(maxSources ?? contract.preflightBudget?.maxSources ?? DEFAULT_MAX_SOURCES);
  const effectiveMaxBytes = Number(maxBytes ?? contract.preflightBudget?.maxBytes ?? DEFAULT_MAX_BYTES);
  if (!Number.isInteger(effectiveMaxSources) || effectiveMaxSources < 1) throw new Error('maxSources must be a positive integer');
  if (!Number.isInteger(effectiveMaxBytes) || effectiveMaxBytes < 1) throw new Error('maxBytes must be a positive integer');
  if (contract.preflightRequired !== true || contract.newAgentsMustReadBeforeExecution !== true) throw new Error('chat-learning preflight contract is not mandatory');
  if (!Array.isArray(contract.canonicalSources) || contract.canonicalSources.length === 0) throw new Error('chat-learning contract has no canonicalSources');

  const queue = stableUnique([...contract.canonicalSources, ...MANDATORY_SUPPLEMENTAL_SOURCES]);
  const queued = new Set(queue);
  const visited = new Set();
  const sources = [];
  const signals = { fingerprints: [], preventions: [], blockers: [], resumeContracts: [] };
  let legacyFastExecutionPolicy = null;
  let fastDevelopmentV2Policy = null;
  let universalCompletionPolicy = null;
  let universalIngressPolicy = null;
  let incidentSelfFixPolicy = null;
  let sourceBytes = Buffer.byteLength(contractRaw, 'utf8');
  while (queue.length) {
    const requested = queue.shift();
    const { normalized, absolute } = normalizeSourcePath(rootDir, requested);
    if (visited.has(normalized)) continue;
    if (visited.size + 1 > effectiveMaxSources) throw new Error(`maxSources exceeded: ${visited.size + 1} > ${effectiveMaxSources}`);
    if (!fs.existsSync(absolute)) throw new Error(`missing learning source: ${normalized}`);
    const raw = fs.readFileSync(absolute, 'utf8');
    const bytes = Buffer.byteLength(raw, 'utf8');
    sourceBytes += bytes;
    let parsed = null;
    if (normalized.endsWith('.json')) {
      try { parsed = JSON.parse(raw); } catch (error) { throw new Error(`invalid JSON learning source ${normalized}: ${error.message}`); }
      if (normalized === LEGACY_FAST_EXECUTION_POLICY_SOURCE) legacyFastExecutionPolicy = parsed;
      if (normalized === FAST_DEVELOPMENT_V2_SOURCE) fastDevelopmentV2Policy = parsed;
      if (normalized === UNIVERSAL_COMPLETION_POLICY_SOURCE) universalCompletionPolicy = parsed;
      if (normalized === UNIVERSAL_INGRESS_POLICY_SOURCE) universalIngressPolicy = parsed;
      if (normalized === INCIDENT_SELF_FIX_POLICY_SOURCE) incidentSelfFixPolicy = parsed;
      collectSignals(parsed, signals);
      if (Array.isArray(parsed.linked_learning_sources)) for (const linked of parsed.linked_learning_sources) {
        if (typeof linked !== 'string' || !linked.trim()) throw new Error(`invalid linked_learning_sources entry in ${normalized}`);
        if (!queued.has(linked) && !visited.has(linked)) { queue.push(linked); queued.add(linked); }
      }
    }
    sources.push({ path: normalized, format: normalized.endsWith('.json') ? 'json' : 'text', bytes, sha256: crypto.createHash('sha256').update(raw).digest('hex'), type: parsed?.type ?? null, version: parsed?.version ?? null, fingerprint: parsed?.fingerprint ?? null });
    visited.add(normalized);
  }

  const legacyFastExecution = validateLegacyFastExecutionPolicy(legacyFastExecutionPolicy);
  const legacyEntrypoint = normalizeSourcePath(rootDir, legacyFastExecution.entrypoint);
  if (!fs.existsSync(legacyEntrypoint.absolute)) throw new Error(`missing legacy fast-execution entrypoint: ${legacyFastExecution.entrypoint}`);
  const fastExecution = validateFastDevelopmentV2(fastDevelopmentV2Policy);
  const v2Entrypoint = normalizeSourcePath(rootDir, fastExecution.entrypoint);
  if (!fs.existsSync(v2Entrypoint.absolute)) throw new Error(`missing Fast Development Protocol v2 entrypoint: ${fastExecution.entrypoint}`);
  const universalCompletion = validateUniversalCompletionPolicy(universalCompletionPolicy);
  const completionEntrypoint = normalizeSourcePath(rootDir, universalCompletion.entrypoint);
  if (!fs.existsSync(completionEntrypoint.absolute)) throw new Error(`missing universal-completion entrypoint: ${universalCompletion.entrypoint}`);
  const universalIngress = validateUniversalIngressPolicy(universalIngressPolicy);
  const ingressEntrypoint = normalizeSourcePath(rootDir, universalIngress.runtimeEntrypoint);
  if (!fs.existsSync(ingressEntrypoint.absolute)) throw new Error(`missing universal-ingress entrypoint: ${universalIngress.runtimeEntrypoint}`);
  const ingressCompletionEntrypoint = normalizeSourcePath(rootDir, universalIngress.completionEntrypoint);
  if (!fs.existsSync(ingressCompletionEntrypoint.absolute)) throw new Error(`missing universal-ingress completion entrypoint: ${universalIngress.completionEntrypoint}`);
  const incidentSelfFix = evaluateIncidentSelfFix({ rootDir, policy: incidentSelfFixPolicy });
  const skillIndexLocation = normalizeSourcePath(rootDir, SKILL_PROJECTION_INDEX_SOURCE);
  if (!fs.existsSync(skillIndexLocation.absolute)) throw new Error(`missing skill projection index: ${SKILL_PROJECTION_INDEX_SOURCE}`);
  const skillIndexManifest = JSON.parse(fs.readFileSync(skillIndexLocation.absolute, 'utf8'));
  if (skillIndexManifest.fingerprint !== 'powerhouse-learning-skill-auto-projection-v1') throw new Error('skill projection index fingerprint drift');
  if (skillIndexManifest.authority !== 'CANONICAL_LEARNING_PROJECTED_NOT_PARALLEL_TRUTH') throw new Error('skill projection index authority drift');
  const skillProjectionIndex = buildSkillProjectionIndex({ rootDir });
  const skillProjectionVerification = verifySkillProjectionIndex({ rootDir, index: skillProjectionIndex });
  if (!skillProjectionVerification.ok) throw new Error(`SKILL_PROJECTION_DRIFT:${JSON.stringify(skillProjectionVerification.drift)}`);
  const skillProjection = selectSkillProjection(skillProjectionIndex, {
    fingerprints: executionContext.relevantLearningFingerprints ?? [],
    targets: executionContext.deliveryLanes ?? [],
    intent: executionContext.intent ?? '',
    maxEntries: 24,
    maxSelectedBytes: Math.min(65_536, Math.floor(effectiveMaxBytes / 3))
  });
  const skillSourceManifest = buildSkillSourceManifest({ rootDir });
  const selectedSkillSources = selectSkillSourceManifest(skillSourceManifest, {
    targets: [...(executionContext.deliveryLanes ?? []), ...skillProjection.inferred_targets]
  });

  const contextLoadMs = Math.max(0, nowMs() - preflightStarted);

  const classificationStarted = nowMs();
  const executionClass = classifyTask({
    task: executionContext.intent ?? '',
    risk: executionContext.risk ?? (executionContext.intent ? 'normal' : 'unknown'),
    explicitClass: executionContext.executionClass ?? null,
    waitingExternal: executionContext.waitingExternal === true,
    impactedContracts: executionContext.impactedContracts ?? []
  });
  const classificationMs = Math.max(0, nowMs() - classificationStarted);
  const executionPacketV2 = buildExecutionPacketV2({
    taskId: executionContext.taskId,
    intent: executionContext.intent,
    executionClass,
    mainSha: executionContext.mainSha,
    lastVerifiedSha: executionContext.lastVerifiedSha,
    lastVerifiedStateId: executionContext.lastVerifiedStateId,
    currentStateId: executionContext.currentStateId,
    componentIds: executionContext.componentIds,
    deliveryLanes: executionContext.deliveryLanes,
    changedPaths: executionContext.changedPaths,
    resourceRefs: executionContext.resourceRefs,
    openObligations: executionContext.openObligations,
    relevantLearningFingerprints: executionContext.relevantLearningFingerprints,
    knownBlockers: executionContext.knownBlockers,
    requiredGates: executionContext.requiredGates,
    configDigest: executionContext.configDigest,
    schemaDigest: executionContext.schemaDigest,
    dependencyDigest: executionContext.dependencyDigest,
    testPolicyDigest: executionContext.testPolicyDigest,
    freshness: executionContext.freshness,
    lazyLoadRefs: executionContext.lazyLoadRefs
  });

  const telemetry = {
    context_load_ms: contextLoadMs,
    classification_ms: classificationMs,
    reasoning_ms: null,
    tool_ms: null,
    targeted_test_ms: null,
    full_gate_ms: null,
    deploy_ms: null,
    proof_ms: null,
    writeback_ms: null,
    total_preflight_ms: Math.max(0, nowMs() - preflightStarted),
    unobserved: true
  };
  const packet = {
    version: 'BRAIN-CHAT-LEARNING-PREFLIGHT-v2',
    status: 'READY',
    contract: contractPath,
    sourceBytes,
    fastExecution,
    legacyFastExecution,
    execution_packet_v2: executionPacketV2,
    telemetry,
    universalCompletion,
    universalIngress,
    incident_self_fix: incidentSelfFix,
    skill_projection: {
      status: 'READY',
      fingerprint: skillProjectionIndex.fingerprint,
      projection_digest: skillProjectionIndex.projection_digest,
      entry_count: skillProjectionIndex.entry_count,
      verification: skillProjectionVerification,
      registry_source: SKILL_PROJECTION_INDEX_SOURCE,
      registry_mode: skillIndexManifest.mode ?? null,
      selection: skillProjection,
      source_attestation: {
        inventory_digest: skillSourceManifest.inventory_digest,
        entry_count: skillSourceManifest.entry_count,
        metadata_warnings: skillSourceManifest.metadata_warnings,
        selection: selectedSkillSources
      }
    },
    sources,
    fingerprints: stableUnique(signals.fingerprints).sort(),
    preventions: stableUnique(signals.preventions).sort(),
    blockers: stableUnique(signals.blockers).sort(),
    resume_contracts: stableUnique(signals.resumeContracts)
  };
  const totalBytes = serializedPacketBytes(packet);
  if (totalBytes > effectiveMaxBytes) throw new Error(`maxBytes exceeded: ${totalBytes} > ${effectiveMaxBytes}`);
  return { ...packet, totalBytes };
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  try { const packet = compileChatLearningPreflight(); process.stdout.write(`${JSON.stringify(packet, null, 2)}\n`); }
  catch (error) { process.stderr.write(`CHAT_LEARNING_PREFLIGHT_FAILED: ${error.message}\n`); process.exitCode = 1; }
}
