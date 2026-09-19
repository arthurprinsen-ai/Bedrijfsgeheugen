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

test('redirect-only Netlify changes use targeted browser proof instead of full-site sweeps', async()=>{
  const lane=await readFile('.github/workflows/lane-website.yml','utf8');
  const risk=JSON.parse(await readFile('site/website-release-risk.json','utf8'));
  assert.match(lane,/redirect-only:netlify\.toml/);
  assert.match(lane,/risk_lane != 'fast-fix'/);
  assert.deepEqual(risk.fastFixRequiredTestSets,['baseline','preview','targeted-browser']);
  assert.ok(risk.nonArtifactPaths.includes('brain/learning/'));
  assert.ok(risk.nonArtifactPaths.includes('tests/brain-'));
});

