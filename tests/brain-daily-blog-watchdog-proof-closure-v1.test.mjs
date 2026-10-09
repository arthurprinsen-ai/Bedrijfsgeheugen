import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('.github/workflows/daily-blog-live-watchdog.yml','utf8');
const material=source.split('      - name: Materialize live proof into ledger')[1]?.split('      - name: Commit proof candidate only')[0];
const commit=source.split('      - name: Commit proof candidate only')[1]?.split('      - name: Open proof PR and dispatch BRAIN shadow')[0];
const pull=source.split('      - name: Open proof PR and dispatch BRAIN shadow')[1];

test('live blog proof remains authoritative, exact and fail closed',()=>{
  assert.ok(material && commit && pull,'canonical workflow steps must remain present');
  assert.match(source,/node tools\/content-growth\/live-readback\.mjs/);
  assert.match(source,/LIVE_BLOG_NOT_LIVE|DAILY_BLOG_NOT_LIVE/);
  assert.match(material,/ledger\.days\[date\]=\{\.\.\.current,state:'live'/);
  assert.match(material,/const proof=JSON\.parse\(fs\.readFileSync\('\/tmp\/daily-live-proof\.json'/);
});

test('one material write creates all mandatory semantic closure artifacts',()=>{
  assert.match(material,/brain\/learning\//);
  assert.match(material,/docs\/development-ledger-events\//);
  assert.match(material,/docs\/changes\//);
  assert.match(material,/fingerprint:/);
  assert.match(material,/root_causes:/);
  assert.match(material,/prevention:/);
  assert.match(material,/evidence:/);
  assert.match(material,/evaluation:\{historical_replay:/);
  assert.match(material,/compiler:\{failure_class:/);
  assert.match(commit,/files=\("data\/content-publication-ledger\.json"/);
  assert.match(commit,/git add -- "\$\{files\[@\]\}"/);
  assert.match(commit,/changedFiles:files,allowedFiles:files/);
});

test('protected writer deduplicates one date and enforces exact machine metadata',()=>{
  assert.match(commit,/EXISTING_DAILY_PROOF_CANDIDATE/);
  assert.match(commit,/gh pr list --state open/);
  assert.match(pull,/Obligation-ID: daily-blog:%s:immutable-live-proof/);
  assert.match(pull,/Delivery-Lane: website/);
  assert.match(pull,/Candidate-Type: recovery/);
  assert.match(pull,/Base-SHA: %s/);
  assert.match(pull,/Change-Scope: %s/);
  assert.match(pull,/Scope-Budget: 4/);
  assert.match(pull,/repo-writer-candidate-shadow\.yml/);
  assert.match(pull,/gh pr merge "\$number" --auto --squash/);
  assert.doesNotMatch(source,/git push origin HEAD:main/);
});
