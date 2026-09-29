import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('apply-i18n stays syntactically valid after route-aware switcher projection', () => {
  assert.doesNotThrow(() => {
    execFileSync(process.execPath,['--check','tools/site-shell/apply-i18n.mjs'],{stdio:'pipe'});
  });
});
