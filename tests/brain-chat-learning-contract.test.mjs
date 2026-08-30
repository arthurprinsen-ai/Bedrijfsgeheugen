import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const requiredLessonIds = [
  'STALE_MAIN_REBUILD_DONT_FORCE',
  'BIND_EVIDENCE_TO_EXACT_SHA_AND_RUN',
  'SEMANTIC_TESTS_IGNORE_SQL_COMMENTS',
  'CROSS_MIGRATION_GRANTS_ARE_ONE_CONTRACT',
  'LINTER_INFO_REQUIRES_WORKLOAD_EVIDENCE',
  'IMMUTABLE_TABLES_REVOKE_TRUNCATE_AND_DDL_PRIVS',
  'SERVICE_ROLE_LEAST_PRIVILEGE_EXPLICIT_GRANTS',
  'CONNECTOR_LIMITATION_IS_HARD_BOUNDARY_NOT_SUCCESS',
  'NETLIFY_READY_IS_NOT_EXACT_SHA_PROOF',
  'API_DEPLOY_SOURCE_DOES_NOT_IMPLY_GIT_AUTODEPLOY',
  'CONCURRENCY_422_INSPECT_BEFORE_OVERWRITE',
  'NO_NOOP_PRODUCTION_CHANGE_FOR_CANARY_PROOF',
  'NEW_TOOL_PREFIX_MUST_BE_BRAIN_CLASSIFIED',
  'WRITERS_ARE_CANDIDATE_ONLY_NO_DIRECT_MAIN',
  'NOTION_IS_PROJECTION_GITHUB_IS_EXECUTABLE_TRUTH',
  'EVENT_DRIVEN_BEFORE_POLLING_FOR_COST',
  'RLS_OPTIMIZATION_MUST_PRESERVE_RUNTIME_SEMANTICS',
  'ADVISOR_ZERO_WARN_DOES_NOT_MEAN_AUTH_CONTROL_FIXED'
];

test('chat-derived failures are machine-readable reusable BRAIN lessons', async () => {
  const raw = await readFile('config/brain-chat-learning-contract.json', 'utf8');
  const config = JSON.parse(raw);
  assert.equal(config.version, 'BRAIN-CHAT-LEARNING-v1');
  assert.equal(config.preflightRequired, true);
  assert.equal(config.newAgentsMustReadBeforeExecution, true);
  assert.ok(Array.isArray(config.lessons));

  const ids = new Set(config.lessons.map((lesson) => lesson.id));
  for (const id of requiredLessonIds) assert.ok(ids.has(id), `missing reusable lesson ${id}`);

  for (const lesson of config.lessons) {
    for (const field of ['id','fingerprint','symptom','rootCause','failedApproach','requiredAction','prevention','evidenceRule']) {
      assert.equal(typeof lesson[field], 'string', `${lesson.id}.${field} must be a string`);
      assert.ok(lesson[field].trim().length > 0, `${lesson.id}.${field} must not be empty`);
    }
  }
});

test('every agent is explicitly required to load chat learning before material work', async () => {
  const agents = await readFile('AGENTS.md', 'utf8');
  assert.match(agents, /config\/brain-chat-learning-contract\.json/);
  assert.match(agents, /fingerprint[^\n]{0,160}(vóór|voor|before)[^\n]{0,160}(uitvoering|execution)/i);
  assert.match(agents, /(zelfde|same)[^\n]{0,120}(fout|failure)[^\n]{0,120}(blokkeer|block|prevent)/i);
});
