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

test('structural proof never claims parity or rollback and operational proof advances only as an independent evidence flag', () => {
  const state = JSON.parse(fs.readFileSync('config/repository-writer-migration.json', 'utf8'));
  for (const writer of state.writers) {
    assert.equal(writer.structuralContractVerified, true, `${writer.name}: structural contract should be machine verified`);
    assert.equal(typeof writer.operationalCandidateVerified, 'boolean', `${writer.name}: operational proof must be an explicit evidence flag`);
    assert.equal(writer.parityVerified, false, `${writer.name}: structural/operational candidate proof must not claim parity`);
    assert.equal(writer.rollbackVerified, false, `${writer.name}: structural/operational candidate proof must not claim rollback`);
  }
  assert.equal(state.writers.some((writer) => writer.operationalCandidateVerified === true), true,
    'at least one writer must retain its evidence-backed operational progress');
  assert.equal(state.writers.some((writer) => writer.operationalCandidateVerified === false), true,
    'unverified writers must remain explicitly blocked');
  assert.equal(state.mainProtectionReady, false);
});
