import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

test('apply-i18n remains parseable and compact mobile injection is not self-embedded', () => {
  const source = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  const parsed = spawnSync(process.execPath,['--check','tools/site-shell/apply-i18n.mjs'],{encoding:'utf8'});
  assert.equal(parsed.status,0, parsed.stderr || parsed.stdout);
  assert.equal((source.match(/function injectMobileLanguage\(html\)/g)||[]).length,1);
  assert.match(source,/MOBILE_LANGUAGE \+ '\$&'/);
});
