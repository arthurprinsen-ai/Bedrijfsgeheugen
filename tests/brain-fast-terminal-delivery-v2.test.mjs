import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('terminal closure falls through from known failed canonical readback to descendant proof', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/CANONICAL_READBACK_NOT_GREEN/);
  assert.doesNotMatch(workflow,/PRODUCTION_READBACK_FAILED:run=\$source_run_id conclusion=\$source_conclusion/);
  assert.match(workflow,/for attempt in \$\(seq 1 12\)/);
  assert.match(workflow,/for attempt in \$\(seq 1 24\)/);
});

test('global and core skills carry fast terminal critical-path authority', async()=>{
  const files=await Promise.all([
    readFile('AGENTS.md','utf8'),
    readFile('.agents/skills/powerhouse-continuity/SKILL.md','utf8'),
    readFile('.agents/skills/powerhouse-delivery-concurrency/SKILL.md','utf8'),
    readFile('.agents/skills/powerhouse-delivery-self-optimization/SKILL.md','utf8')
  ]);
  const joined=files.join('\n');
  assert.match(joined,/delivery\|fast-terminal\|critical-path\|v2/);
  assert.match(joined,/delivery\|predictive-landing-coalescing\|v1/);
  assert.match(joined,/time-to-terminal-proof/i);
});

test('redirect-only Netlify changes keep targeted proof plus mandatory public visibility', async()=>{
  const lane=await readFile('.github/workflows/lane-website.yml','utf8');
  const risk=JSON.parse(await readFile('site/website-release-risk.json','utf8'));
  assert.match(lane,/redirect-only:netlify\.toml/);
  assert.match(lane,/risk_lane == 'high-risk'/);
  assert.deepEqual(risk.fastFixRequiredTestSets,['baseline','preview','targeted-browser','public-visibility']);
  assert.ok(risk.nonArtifactPaths.includes('brain/learning/'));
  assert.ok(risk.nonArtifactPaths.includes('tests/brain-'));
});

test('terminal closure requires exact-head critical gates before LIVE_BEWEZEN', async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  const gate=workflow.indexOf('Verify exact-head critical delivery gates before terminal claim');
  const production=workflow.indexOf('Wait for canonical production release readback');
  const persist=workflow.indexOf('Persist canonical Brain terminal evidence before terminal claim');
  assert.ok(gate > -1 && production > gate && persist > production);
  assert.match(workflow,/require_workflow "required-test\.yml" "Required"/);
  assert.match(workflow,/require_workflow "unified-brain-delivery\.yml" "BRAIN"/);
  assert.match(workflow,/require_workflow "powerhouse-codeql\.yml" "Powerhouse-CodeQL"/);
  assert.match(workflow,/TERMINAL_CRITICAL_GATE_FAILED/);
});

test('regulatory data keeps bounded affected routes while public visibility remains unconditional', async()=>{
  const risk=JSON.parse(await readFile('site/website-release-risk.json','utf8'));
  assert.deepEqual(risk.pageLocalAssets['data/regelgeving.json'],['/','/ai-act','/compliance-status','/benchmark','/monitor']);
  assert.ok(!risk.normalRequiredTestSets.includes('public-visibility'));
  assert.ok(risk.highRiskRequiredTestSets.includes('public-visibility'));
  const lane=await readFile('.github/workflows/lane-website.yml','utf8');
  assert.match(lane,/Verify all public pages are visibly rendered\n\s+env:/);
  assert.doesNotMatch(lane,/Verify all public pages are visibly rendered\n\s+if:/);
  assert.match(lane,/Verify every header menu panel is readable\n\s+if: needs\.classify\.outputs\.risk_lane == 'high-risk'/);
});
