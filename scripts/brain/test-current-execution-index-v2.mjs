import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const policy = JSON.parse(readFileSync('brain/policies/chat-to-brain-completeness-v1.json', 'utf8'));
const index = JSON.parse(readFileSync('brain/learning/chat-execution-index-v2-2026-08-31.json', 'utf8'));

assert.equal(index.status, 'ACTIVE');
assert.ok(policy.linked_learning_sources.includes('brain/learning/chat-execution-index-v2-2026-08-31.json'));
assert.equal(index.recovered.find(x => x.fingerprint === 'brain-writeback-make-team-paused-limit-v1')?.status, 'PROVEN_FIXED');
assert.equal(index.recovered.find(x => x.fingerprint === 'supabase|production-migration|connector-permission-denied')?.status, 'PROVEN_FIXED');
assert.equal(index.open_external_boundaries.find(x => x.id === 'github-native-main-protection')?.status, 'BLOCKED_EXTERNAL');
assert.equal(index.open_external_boundaries.find(x => x.id === 'supabase-leaked-password-protection')?.status, 'BLOCKED_EXTERNAL');
assert.equal(index.open_external_boundaries.find(x => x.id === 'make-worker-supabase-connection')?.status, 'AWAITING_ACCOUNT_AUTHORIZATION');
assert.ok(index.runtime_invariants.some(x => x.includes('COALESCED_REFRESH')));
assert.equal(index.security.contains_secrets, false);
assert.equal(index.security.contains_credentials, false);
assert.equal(index.security.contains_pii, false);
console.log('PASS current execution index v2');
