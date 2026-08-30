import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const writers = {
  'approved-central-blog': '.github/workflows/approved-central-blog.yml',
  'blog-bijwerken': '.github/workflows/blog-bijwerken.yml',
  'menu-balk-fix': '.github/workflows/menu-balk-fix.yml',
  'paginacontrole': '.github/workflows/paginacontrole.yml',
  'regelgeving-bijwerken': '.github/workflows/regelgeving-bijwerken.yml',
  'seo-controle': '.github/workflows/seo-controle.yml',
  'weekblog': '.github/workflows/weekblog.yml',
};

const candidateOnly = new Set(['approved-central-blog', 'menu-balk-fix', 'regelgeving-bijwerken', 'seo-controle']);
const legacyDualMode = new Set(['blog-bijwerken', 'paginacontrole', 'weekblog']);
const text = Object.fromEntries(Object.entries(writers).map(([name, path]) => [name, fs.readFileSync(path, 'utf8')]));

function mustHaveCandidateContract(name, workflow) {
  if (candidateOnly.has(name)) {
    assert.match(workflow, /delivery_mode:[\s\S]*?default:\s*candidate-pr[\s\S]*?candidate-pr/, `${name}: candidate-only must remain default`);
    assert.doesNotMatch(workflow, /default:\s*direct\b/, `${name}: direct default must not return`);
  } else {
    assert.ok(legacyDualMode.has(name), `${name}: writer migration class must be explicit`);
    assert.match(workflow, /delivery_mode:[\s\S]*?default:\s*direct[\s\S]*?candidate-pr/, `${name}: legacy dual-mode contract must remain explicit until migrated`);
  }
  assert.match(workflow, /createWriterCandidate/, `${name}: canonical candidate builder required`);
  assert.match(workflow, new RegExp(`writer:\\s*['\"]${name}['\"]`), `${name}: candidate identity must bind writer`);
  assert.match(workflow, /gh pr create/, `${name}: candidate must terminate in a PR`);
  assert.doesNotMatch(workflow, /gh\s+pr\s+merge/, `${name}: writer must never self-merge`);
  assert.match(workflow, /repo-schrijven/, `${name}: repository writes remain serialized`);
}

test('all governed writers have an explicit v2 migration class and candidate contract', () => {
  assert.equal(candidateOnly.size + legacyDualMode.size, Object.keys(writers).length);
  for (const [name, workflow] of Object.entries(text)) mustHaveCandidateContract(name, workflow);
});

test('content writers validate before every allowed delivery destination', () => {
  for (const name of ['approved-central-blog', 'blog-bijwerken', 'weekblog']) {
    const workflow = text[name];
    const validation = workflow.search(/Deterministic (?:contract checks|update contract checks|publication contract checks)/);
    const candidate = workflow.indexOf('createWriterCandidate');
    assert.ok(validation >= 0 && candidate > validation, `${name}: validation must precede candidate creation`);
    if (legacyDualMode.has(name)) {
      const direct = workflow.indexOf('Direct publiceren op huidige veilige pad');
      assert.ok(direct > validation, `${name}: validation must precede legacy direct delivery`);
    }
  }
});

test('candidate delivery cannot falsely complete external production state', () => {
  assert.doesNotMatch(text['approved-central-blog'], /--mark-dispatched/,
    'approved-central-blog candidate handoff must leave Notion queue pending until production proof');
  assert.match(text['approved-central-blog'], /queue_dispatch_state=pending_until_production_proof/);
  assert.match(text['blog-bijwerken'], /Notion op Goedgekeurd zetten na succesvolle directe publicatie[\s\S]*?steps\.commit\.outputs\.delivery == 'direct'/);
  assert.match(text['weekblog'], /Notion bijwerken na succesvolle directe publicatie[\s\S]*?steps\.commit\.outputs\.delivery == 'direct'/);
  assert.match(text.paginacontrole, /inputs\.delivery_mode != 'candidate-pr'/);
});

test('migrated low-risk writers are candidate-only PR writers', () => {
  for (const name of ['menu-balk-fix', 'regelgeving-bijwerken', 'seo-controle']) {
    const workflow = text[name];
    assert.match(workflow, /default:\s*candidate-pr/);
    assert.doesNotMatch(workflow, /default:\s*direct\b/);
    assert.match(workflow, /git push origin "HEAD:\$CANDIDATE_BRANCH"/);
    assert.match(workflow, /gh pr create/);
    assert.doesNotMatch(workflow, /git\s+push\s+origin\s+(?:HEAD:)?main\b/);
  }
});

test('writer-created PRs explicitly dispatch immutable shadow verification with exact identity', () => {
  const shadow = fs.readFileSync('.github/workflows/repo-writer-candidate-shadow.yml', 'utf8');
  assert.match(shadow, /workflow_dispatch:/, 'shadow verifier must support explicit dispatch because GITHUB_TOKEN PRs do not recursively trigger Actions');
  for (const input of ['pr_number', 'base_sha', 'head_sha', 'head_ref']) {
    assert.match(shadow, new RegExp(`${input}:`), `shadow verifier must require ${input}`);
  }
  assert.match(shadow, /github\.event\.inputs\.head_sha|inputs\.head_sha/, 'shadow checkout must bind exact dispatched head sha');
  assert.match(shadow, /GITHUB_PR_BASE_SHA:[\s\S]*?(github\.event\.inputs\.base_sha|inputs\.base_sha)/);
  assert.match(shadow, /GITHUB_PR_HEAD_SHA:[\s\S]*?(github\.event\.inputs\.head_sha|inputs\.head_sha)/);
  assert.match(shadow, /GITHUB_HEAD_REF:[\s\S]*?(github\.event\.inputs\.head_ref|inputs\.head_ref)/);

  const approved = text['approved-central-blog'];
  assert.match(approved, /gh workflow run repo-writer-candidate-shadow\.yml/,
    'writer must explicitly dispatch shadow verification after creating its candidate PR');
  assert.match(approved, /-f pr_number=/);
  assert.match(approved, /-f base_sha=/);
  assert.match(approved, /-f head_sha=/);
  assert.match(approved, /-f head_ref=/);
});

test('current permission boundary fails writer readiness closed without claiming parity or rollback', () => {
  const state = JSON.parse(fs.readFileSync('config/repository-writer-migration.json', 'utf8'));
  assert.equal(state.prCreationBoundary?.status, 'BLOCKED_HARD_BOUNDARY');
  assert.equal(state.mainProtectionReady, false);
  for (const writer of state.writers) {
    assert.equal(writer.structuralContractVerified, true, `${writer.name}: structural contract should remain machine verified`);
    assert.equal(writer.operationalCandidateVerified, false, `${writer.name}: current operational readiness must fail closed while Actions PR creation is blocked`);
    assert.equal(writer.parityVerified, false, `${writer.name}: structural/history proof must not claim parity`);
    assert.equal(writer.rollbackVerified, false, `${writer.name}: structural/history proof must not claim rollback`);
  }
});
