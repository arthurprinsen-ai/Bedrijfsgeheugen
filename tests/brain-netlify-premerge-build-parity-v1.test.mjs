import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('Netlify deterministic build defects are blocked before merge', async()=>{
  const [workflow,skill,learning]=await Promise.all([
    read('.github/workflows/required-test.yml'),
    read('.agents/skills/powerhouse-netlify-production-truth/SKILL.md'),
    read('brain/learning/2026-09-30-netlify-premerge-build-parity-test-ownership-v1.json')
  ]);
  for(const path of [
    'tests/ai-model-advisor-v1.test.mjs',
    'tests/ai-model-production-hotfix-v1.test.mjs',
    'tests/ai-model-seo-cluster-v1.test.mjs',
    'tests/brain-netlify-premerge-build-parity-v1.test.mjs'
  ]) assert.ok(workflow.includes(path), 'missing CI ownership: '+path);
  assert.ok(workflow.includes('Validate fail-closed static English cache before merge'));
  assert.ok(workflow.includes('Run exact Netlify production build parity before merge'));
  assert.ok(workflow.includes("netlify_build_required: ${{ steps.scope.outputs.netlify_build_required }}"));
  assert.ok(workflow.includes("if: steps.scope.outputs.netlify_build_required == 'true'"));
  assert.ok(workflow.includes("const netlifyBuildPrefixes=['components/','assets/','pages/','site/','blog/','kennis/','portal/','portal-next/','portal-v2/','netlify/functions/','tools/site-shell/']"));
  assert.ok(workflow.includes("STATIC_I18N_REQUIRE_CACHE: '1'"));
  assert.ok(skill.includes('netlify-premerge-build-parity-test-ownership-v1'));
  const j=JSON.parse(learning);
  assert.equal(j.compiler.failure_class,'DETERMINISTIC_BUILD_DEFECT_REACHED_PRODUCTION_PROMOTION');
  assert.equal(j.status,'ACTIVE_PREVENTION');
});
