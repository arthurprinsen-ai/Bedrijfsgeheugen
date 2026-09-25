import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('scheduler recovery cannot regress terminal i18n delivery contracts', () => {
  const apply = fs.readFileSync('tools/site-shell/apply-i18n.mjs','utf8');
  const verify = fs.readFileSync('tools/site-shell/verify-pricing-i18n-production.mjs','utf8');
  const workflow = fs.readFileSync('.github/workflows/production-source-snapshot.yml','utf8');

  assert.match(apply,/const hasI18nCss =/);
  assert.match(apply,/const hasI18nScript =/);
  assert.match(apply,/html = injectMobileLanguage\(html\);/);
  assert.doesNotMatch(apply,/if \(!\/<html\\b\/i\.test\(html\) \|\| \/data-bg-i18n-asset\/\.test\(html\)\) return;/);

  assert.match(verify,/async function switchPublicLocale/);
  assert.match(verify,/mandatoryRoutes/);
  assert.match(verify,/\/systemen-koppelen/);
  assert.match(verify,/\/en\/systemen-koppelen/);

  assert.match(workflow,/group:\s*production-source-snapshot-main-v2/);
  assert.match(workflow,/pricing-interactions-rescue-v1\.js\?v=3de3592ac866/);
  assert.doesNotMatch(workflow,/pricing-interactions-rescue-v1\.js\?v=600965d2d30f/);
});
