import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const reg = JSON.parse(readFileSync('brain/content-publication-blocker-register.json', 'utf8'));

test('register has historical blockers with cause or prevention and a real source file', () => {
  assert.ok(reg.historical_blockers.length >= 300);
  for (const e of reg.historical_blockers) {
    assert.ok(e.fingerprint && e.source, e.fingerprint);
    assert.ok(e.cause || e.prevention, `${e.fingerprint} has neither cause nor prevention`);
    assert.ok(existsSync(e.source), `${e.source} missing`);
  }
});

test('register keeps every known provider/obligation blocker code with a prevention', () => {
  const codes = reg.provider_and_obligation_blockers.map((b) => b.code);
  for (const c of ['SILENT_PUBLICATION_FAILURE', 'MEDIA_ASSET_REQUIRED', 'VIDEO_FRAME_CANONICAL_MIRA_FACE_MISMATCH',
    'GLOBAL_POST_DUPLICATE_BLOCKED:STORY_FAMILY_DUPLICATE', 'LINKEDIN_REAUTH_REQUIRED', 'GITHUB_ACTIONS_PR_CREATION_DENIED',
    'NO_OBLIGATION_ROW', 'DOCS_CHANGES_GITIGNORED', 'MIGRATION_LOCK_PARITY']) {
    assert.ok(codes.includes(c), c);
  }
  for (const b of reg.provider_and_obligation_blockers) assert.ok(b.prevention && b.cause, b.code);
});

test('AGENTS.md tells every agent to consult the register before blog/post work', () => {
  const a = readFileSync('AGENTS.md', 'utf8');
  assert.match(a, /brain\/content-publication-blocker-register\.json/);
});
