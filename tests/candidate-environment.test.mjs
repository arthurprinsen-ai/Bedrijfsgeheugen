import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCandidateEnvironment } from '../tools/delivery/candidate-environment.mjs';

const candidate = {
  change_id:'chg-1', pr:123, git_sha:'a'.repeat(40), netlify_deploy_id:'netlify-1',
  supabase_branch_id:'sb-pr-123', schema_revision:'20260916120000', artifact_digest:'sha256:'+'b'.repeat(64),
  evidence:{frontend_sha:'a'.repeat(40), backend_sha:'a'.repeat(40), database_schema_revision:'20260916120000'}
};

test('accepts one internally consistent immutable candidate', () => assert.equal(validateCandidateEnvironment(candidate).ok, true));
test('fails closed on missing identity', () => assert.equal(validateCandidateEnvironment({...candidate, supabase_branch_id:''}).ok, false));
test('fails closed on frontend/backend SHA mismatch', () => assert.equal(validateCandidateEnvironment({...candidate,evidence:{...candidate.evidence,backend_sha:'c'.repeat(40)}}).ok, false));
test('fails closed on schema mismatch', () => assert.equal(validateCandidateEnvironment({...candidate,evidence:{...candidate.evidence,database_schema_revision:'other'}}).ok, false));
