import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FAST_EXECUTION_VERSION,
  classifyTask,
  buildStablePolicyPrefix,
  compactToolOutput,
  EvidenceCache,
  LatencyTrace,
  runParallelStateRetrieval,
  buildMinimalContextPack,
  buildExecutionPacketV2,
  computeDeltaContext,
  detectNoOp,
  buildEvidenceIdentity,
  buildDeltaWriteback
} from '../scripts/brain/powerhouse-fast-execution.mjs';

test('classifies work into exactly FAST STANDARD CRITICAL WAITING_EXTERNAL', () => {
  assert.equal(classifyTask({ task: 'status readback van huidige deploy' }), 'FAST');
  assert.equal(classifyTask({ task: 'fix bug en deploy feature' }), 'STANDARD');
  assert.equal(classifyTask({ task: 'security schema migration' }), 'CRITICAL');
  assert.equal(classifyTask({ task: 'wacht op externe provider', waitingExternal: true }), 'WAITING_EXTERNAL');
  assert.equal(classifyTask({ task: '', risk: 'unknown' }), 'CRITICAL');
});

test('stable policy prefix exposes v2 incremental invariants', () => {
  const a = buildStablePolicyPrefix(); const b = buildStablePolicyPrefix();
  assert.deepEqual(a, b);
  assert.equal(FAST_EXECUTION_VERSION, 'POWERHOUSE-FAST-DEVELOPMENT-PROTOCOL-v2');
  assert.equal(a.version, FAST_EXECUTION_VERSION);
  assert.equal(a.deltaFirst, true);
  assert.equal(a.noOpBeforeReasoning, true);
  assert.equal(a.fullReleaseGatesAtPromotionBoundary, true);
  assert.equal(a.productionReadbackCacheable, false);
});

test('tool output is bounded and handles unsafe serialization', () => {
  const huge = Array.from({ length: 1000 }, (_, i) => `line ${i}`).join('\n');
  const compacted = compactToolOutput(huge, { maxChars: 1200, maxLines: 40 });
  assert.ok(compacted.length <= 1400); assert.match(compacted, /TRUNCATED/); assert.equal(compactToolOutput(undefined), 'undefined');
  const cyclic = {}; cyclic.self = cyclic; assert.match(compactToolOutput(cyclic), /\[Unserializable tool output:/);
});

test('delta context returns changed relevant keys and fails closed on contradictory identity', () => {
  assert.deepEqual(computeDeltaContext({ lastVerifiedState: { sha: 'a', config: 1, site: 1 }, currentState: { sha: 'b', config: 1, site: 2 }, relevantKeys: ['site','config'] }), { site: { before: 1, after: 2 } });
  const fallback = computeDeltaContext({ lastVerifiedState: null, currentState: { sha: 'b' } });
  assert.equal(fallback.failClosed, true);
  assert.equal(fallback.fallback, 'FULL_CANONICAL_PREFLIGHT');
});

test('execution packet v2 is deterministic bounded and carries mandatory identity', () => {
  const input = { taskId: 'T1', intent: 'fix portal spacing', executionClass: 'FAST', mainSha: 'main1', lastVerifiedSha: 'v1', lastVerifiedStateId: 's1', currentStateId: 's2', componentIds: ['portal'], deliveryLanes: ['portal'], changedPaths: ['portal-v2/a.css'], resourceRefs: ['portal-v2/a.css'], openObligations: [], relevantLearningFingerprints: ['known'], knownBlockers: [], requiredGates: ['required'], configDigest: 'cfg', schemaDigest: 'schema', dependencyDigest: 'dep', testPolicyDigest: 'tests', freshness: { class: 'PERIODIC' }, lazyLoadRefs: ['history:T1'] };
  const a = buildExecutionPacketV2(input); const b = buildExecutionPacketV2(input);
  assert.deepEqual(a, b);
  for (const key of ['protocol_version','task_id','intent_digest','execution_class','main_sha','last_verified_sha','last_verified_state_id','current_state_id','component_ids','delivery_lanes','changed_paths','resource_refs','open_obligations','relevant_learning_fingerprints','known_blockers','required_gates','config_digest','schema_digest','dependency_digest','test_policy_digest','freshness','lazy_load_refs']) assert.ok(key in a, key);
  assert.ok(JSON.stringify(a).length < 12000);
});

test('no-op detection stops redundant work only with auditable evidence', () => {
  assert.deepEqual(detectNoOp({ desiredFingerprint: 'x', provenFingerprints: [{ fingerprint: 'x', evidenceRef: 'ev:1', valid: true }] }), { status: 'NO_CHANGE_NEEDED', evidence: ['ev:1'] });
  assert.equal(detectNoOp({ desiredFingerprint: 'x', provenFingerprints: [{ fingerprint: 'x', evidenceRef: 'ev:old', valid: false }] }).status, 'CHANGE_REQUIRED');
});

test('evidence identity binds exact candidate environment config schema dependencies gate and contracts', () => {
  const base = { candidateSha: 'c1', environment: 'preview', configDigest: 'cfg', schemaDigest: 'sch', dependencyDigest: 'dep', gateVersion: 'g1', contractDigest: 'ct' };
  const a = buildEvidenceIdentity(base); const b = buildEvidenceIdentity(base);
  assert.equal(a, b); assert.match(a, /^[a-f0-9]{64}$/);
  assert.notEqual(a, buildEvidenceIdentity({ ...base, schemaDigest: 'sch2' }));
  assert.notEqual(a, buildEvidenceIdentity({ ...base, gateVersion: 'g2' }));
});

test('evidence cache expires invalidates identity and never serves forbidden proof types', () => {
  let now = 1000; const cache = new EvidenceCache({ now: () => now });
  const identity = buildEvidenceIdentity({ candidateSha: 'c1', environment: 'preview', configDigest: 'cfg', schemaDigest: 'sch', dependencyDigest: 'dep', gateVersion: 'g1', contractDigest: 'ct' });
  cache.put(identity, { green: true }, { ttlMs: 100, evidenceType: 'unit-test', identity });
  assert.deepEqual(cache.get(identity, { identity, evidenceType: 'unit-test' }), { green: true });
  assert.equal(cache.get(identity, { identity: 'other', evidenceType: 'unit-test' }), null);
  assert.equal(cache.put(identity + ':prod', { green: true }, { ttlMs: 100, evidenceType: 'production-readback', identity }), null);
  now = 1101; assert.equal(cache.get(identity, { identity, evidenceType: 'unit-test' }), null);
});

test('state retrieval starts independent adapters concurrently', async () => {
  const starts = []; const adapter = name => async () => { starts.push(name); await new Promise(resolve => setTimeout(resolve, 25)); return name; };
  const result = await runParallelStateRetrieval({ github: adapter('github'), runtime: adapter('runtime'), data: adapter('data'), obligations: adapter('obligations') });
  assert.equal(starts.length, 4); assert.deepEqual(result, { github: 'github', runtime: 'runtime', data: 'data', obligations: 'obligations' });
});

test('minimal context packet stays task scoped and bounded', () => {
  const packet = buildMinimalContextPack({ task: 'check deploy', executionClass: 'FAST', hotState: { currentSha: 'abc', irrelevant: 'x'.repeat(10000) }, delta: [{ id: 1, change: 'deploy' }], evidence: [{ key: 'deploy', value: 'green' }], maxChars: 2500 });
  assert.equal(packet.executionClass, 'FAST'); assert.equal(packet.task, 'check deploy'); assert.ok(JSON.stringify(packet).length <= 2500);
});

test('delta writeback contains changed facts only', () => {
  const w = buildDeltaWriteback({ changed: ['a'], evidence: ['e'], outcome: 'SUCCESS', learning: ['l'], obligationDelta: [], timing: { total_lead_time_ms: 5 }, cacheUsage: { hits: 1 }, openObligations: [] });
  assert.deepEqual(Object.keys(w), ['changed','evidence','outcome','learning','obligation_delta','timing','cache_usage','open_obligations']);
});

test('latency trace emits v2 lead-time fields', () => {
  let now = 100; const trace = new LatencyTrace({ now: () => now });
  for (const [name, ms] of [['contextLoad',3],['classification',2],['reasoning',5],['tool',7],['targetedTest',11],['fullGate',13],['deploy',17],['proof',19],['writeback',23]]) { trace.markStart(name); now += ms; trace.markEnd(name); }
  const metrics = trace.snapshot();
  for (const key of ['context_load_ms','classification_ms','reasoning_ms','tool_ms','targeted_test_ms','full_gate_ms','deploy_ms','proof_ms','writeback_ms','total_lead_time_ms']) assert.equal(typeof metrics[key], 'number');
});
