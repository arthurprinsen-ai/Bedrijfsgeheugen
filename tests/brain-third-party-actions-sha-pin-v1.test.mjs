import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Third-party GitHub Actions run with repository secrets. A moving tag (@v1) lets the
// action owner change what runs in our workflow. First-party owners keep version tags.
const FIRST_PARTY = new Set(['actions', 'github']);
const USES = /^\s*-?\s*uses:\s*([^\s@#]+)@([^\s#]+)/;

export function unpinnedThirdPartyActions(source) {
  const bad = [];
  source.split('\n').forEach((line, i) => {
    const m = USES.exec(line);
    if (!m) return;
    const [, name, ref] = m;
    if (name.startsWith('./') || name.startsWith('docker://')) return;
    const owner = name.split('/')[0];
    if (FIRST_PARTY.has(owner)) return;
    if (!/^[0-9a-f]{40}$/.test(ref)) bad.push({ line: i + 1, name, ref });
  });
  return bad;
}

test('historical replay: the four tag-pinned third-party uses from 2026-10-29 are caught', () => {
  const before = [
    '      - uses: openai/codex-action@v1',
    '      - uses: supabase/setup-cli@v1',
  ].join('\n');
  assert.equal(unpinnedThirdPartyActions(before).length, 2);
});

test('shadow: pinned third-party actions and first-party tags pass', () => {
  const ok = [
    '      - uses: openai/codex-action@bdf19a4a223ec2549a3e2274a0cf61556bc07675 # v1',
    '      - uses: actions/checkout@v5',
    '      - uses: github/codeql-action/init@v4',
    '      - uses: ./.github/actions/local',
  ].join('\n');
  assert.deepEqual(unpinnedThirdPartyActions(ok), []);
});

test('canary: every workflow on this branch pins third-party actions to a commit', () => {
  const dir = '.github/workflows';
  const failures = [];
  for (const f of fs.readdirSync(dir).filter((n) => /\.ya?ml$/.test(n))) {
    const bad = unpinnedThirdPartyActions(fs.readFileSync(path.join(dir, f), 'utf8'));
    for (const b of bad) failures.push(`${f}:${b.line} ${b.name}@${b.ref}`);
  }
  assert.deepEqual(failures, []);
});
