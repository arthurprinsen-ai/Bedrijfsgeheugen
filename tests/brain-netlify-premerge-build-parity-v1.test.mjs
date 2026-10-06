import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('Netlify deterministic build defects are blocked once in the canonical website lane', async()=>{
  const [required,website,skill,learning]=await Promise.all([
    read('.github/workflows/required-test.yml'),
    read('.github/workflows/lane-website.yml'),
    read('.agents/skills/powerhouse-netlify-production-truth/SKILL.md'),
    read('brain/learning/2026-09-30-netlify-premerge-build-parity-test-ownership-v1.json')
  ]);
  for(const path of [
    'tests/ai-model-advisor-v1.test.mjs',
    'tests/ai-model-production-hotfix-v1.test.mjs',
    'tests/ai-model-seo-cluster-v1.test.mjs',
    'tests/brain-netlify-premerge-build-parity-v1.test.mjs'
  ]) assert.ok(required.includes(path), 'missing CI ownership: '+path);

  assert.ok(required.includes('Validate fail-closed static English cache before merge'));
  assert.doesNotMatch(required,/Run exact Netlify deploy-preview build parity before merge/);
  assert.doesNotMatch(required,/Run exact Netlify production build parity before merge/);
  assert.doesNotMatch(required,/netlify_build_required/);

  assert.match(website,/name: Run exact Netlify production build command/);
  assert.match(website,/STATIC_I18N_REQUIRE_CACHE: '1'/);
  assert.match(website,/Verify built artifact contracts/);

  assert.ok(skill.includes('netlify-premerge-build-parity-test-ownership-v1'));
  const j=JSON.parse(learning);
  assert.equal(j.compiler.failure_class,'DETERMINISTIC_BUILD_DEFECT_REACHED_PRODUCTION_PROMOTION');
  assert.equal(j.status,'ACTIVE_PREVENTION');
});
