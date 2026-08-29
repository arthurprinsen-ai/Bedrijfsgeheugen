import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const workflow = await readFile('.github/workflows/paginacontrole.yml', 'utf8');

test('paginacontrole rebases main before every automated git push', () => {
  const pushes = [...workflow.matchAll(/^\s*git push\s*$/gm)];
  assert.equal(pushes.length, 2, 'expected exactly two automated git push paths');

  for (const push of pushes) {
    const beforePush = workflow.slice(Math.max(0, push.index - 180), push.index);
    assert.match(
      beforePush,
      /git pull --rebase origin main\s*$/m,
      'every automated push must first rebase onto current main to avoid non-fast-forward failures',
    );
  }
});
