import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolveTerminalMigrationIdentity } from '../tools/delivery/terminal-migration-identity.mjs';

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
  assert.match(workflow,/require_brain_evidence\(\)/);
  assert.match(workflow,/actions\/workflows\/unified-brain-delivery\.yml\/runs/);
  assert.match(workflow,/require_workflow "codeql\.yml" "Powerhouse-CodeQL"/);
  assert.doesNotMatch(workflow,/require_workflow "powerhouse-codeql\.yml" "Powerhouse-CodeQL"/);
  const codeql=await readFile(".github/workflows/codeql.yml","utf8");
  assert.match(codeql,/^name: Powerhouse CodeQL$/m);
  assert.match(codeql,/github\/codeql-action\/analyze@v4/);
  assert.match(workflow,/TERMINAL_CRITICAL_GATE_FAILED/);
});


test('regulatory data maps to bounded routes while public visibility remains universal and broad browser sweeps stay high-risk', async()=>{
  const risk=JSON.parse(await readFile('site/website-release-risk.json','utf8'));
  assert.deepEqual(risk.pageLocalAssets['data/regelgeving.json'],['/','/ai-act','/compliance-status','/benchmark','/monitor']);
  assert.ok(risk.fastFixRequiredTestSets.includes('public-visibility'));
  assert.ok(risk.highRiskRequiredTestSets.includes('public-visibility'));
  const lane=await readFile('.github/workflows/lane-website.yml','utf8');
  assert.match(lane,/Verify all public pages are visibly rendered\n\s+env:/);
  assert.doesNotMatch(lane,/Verify all public pages are visibly rendered\n\s+if:/);
  assert.match(lane,/Verify every header menu panel is readable\n\s+if: needs\.classify\.outputs\.risk_lane == 'high-risk'/);
});

test('terminal migration readback accepts exact versions even when two true migrations share a name',()=>{
  const name='powerhouse_identity_graph_replay_baseline_v1';
  const paths=[
    'supabase/migrations/20261007063438_'+name+'.sql',
    'supabase/migrations/20261008080905_'+name+'.sql'
  ];
  for(const version of ['20261007063438','20261008080905']){
    const actual=resolveTerminalMigrationIdentity({version,name,source_pr:4118},paths);
    assert.equal(actual.version,version);
    assert.equal(actual.resolution,'EXACT_VERSION');
    assert.equal(actual.canonical_path,'supabase/migrations/'+version+'_'+name+'.sql');
  }
  const providerName='commercial_day_provider_proof_brain_v1';
  const providers=[
    'supabase/migrations/20261008080913_'+providerName+'.sql',
    'supabase/migrations/20261008094000_'+providerName+'.sql'
  ];
  assert.equal(
    resolveTerminalMigrationIdentity({version:'20261008080913',name:providerName},providers).version,
    '20261008080913'
  );
  assert.equal(
    resolveTerminalMigrationIdentity({version:'20261008094000',name:providerName},providers).version,
    '20261008094000'
  );
});

test('historical migration-name fallback remains fail-closed when exact version is missing',()=>{
  const name='powerhouse_identity_graph_replay_baseline_v1';
  const two=[
    'supabase/migrations/20261007063438_'+name+'.sql',
    'supabase/migrations/20261008080905_'+name+'.sql'
  ];
  assert.throws(
    ()=>resolveTerminalMigrationIdentity({version:'20261008070000',name},two),
    /SUPABASE_MIGRATION_CANONICAL_IDENTITY_AMBIGUOUS/
  );
  const one=[two[0]];
  const resolved=resolveTerminalMigrationIdentity({version:'20261008070000',name},one);
  assert.equal(resolved.version,'20261007063438');
  assert.equal(resolved.resolution,'UNIQUE_NAME');
  assert.deepEqual(resolveTerminalMigrationIdentity({version:'20261008070000',name},[]),
    {version:'20261008070000',name});
  assert.throws(
    ()=>resolveTerminalMigrationIdentity({version:'../../secret',name},two),
    /SUPABASE_MIGRATION_IDENTITY_INVALID/
  );
});

test('terminal workflow uses exact version-first resolver rather than name-only lookup',async()=>{
  const workflow=await readFile('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(workflow,/import \{ resolveTerminalMigrationIdentity \} from '\.\/tools\/delivery\/terminal-migration-identity\.mjs'/);
  assert.match(workflow,/resolveTerminalMigrationIdentity\(item,currentMigrationPaths\)/);
  assert.doesNotMatch(workflow,/matches\.length>1\) throw new Error\(`SUPABASE_MIGRATION_CANONICAL_IDENTITY_AMBIGUOUS/);
});
