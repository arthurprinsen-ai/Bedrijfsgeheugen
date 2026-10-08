import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveTerminalMigrationIdentities} from '../tools/delivery/terminal-migration-identity.mjs';

const baseline='powerhouse_identity_graph_replay_baseline_v1';
const sourceFiles=[
  `supabase/migrations/20261007063438_${baseline}.sql`,
  `supabase/migrations/20261008080905_${baseline}.sql`,
  'supabase/migrations/20261008080913_commercial_day_provider_proof_brain_v1.sql',
  'supabase/migrations/20261008094000_commercial_day_provider_proof_brain_v1.sql'
];

test('two legitimate versions with the same name preserve exact ledger identity',()=>{
  const input=[
    {version:'20261007063438',name:baseline},
    {version:'20261008080905',name:baseline},
    {version:'20261008080913',name:'commercial_day_provider_proof_brain_v1'},
    {version:'20261008094000',name:'commercial_day_provider_proof_brain_v1'}
  ];
  const resolved=resolveTerminalMigrationIdentities(input,sourceFiles);
  assert.deepEqual(resolved.map(x=>x.version),input.map(x=>x.version));
  assert.deepEqual(resolved.map(x=>x.canonical_path),sourceFiles);
});

test('single known renamed historical alias maps to the unique applied version',()=>{
  const item={version:'20261008013000',name:baseline,source_pr:123};
  const [resolved]=resolveTerminalMigrationIdentities([item],[sourceFiles[1]]);
  assert.equal(resolved.version,'20261008080905');
  assert.equal(resolved.historical_version,item.version);
  assert.equal(resolved.canonical_path,sourceFiles[1]);
  assert.equal(resolved.source_pr,123);
});

test('missing exact version with two same-name choices remains a hard error',()=>{
  assert.throws(
    ()=>resolveTerminalMigrationIdentities([{version:'20261008010000',name:baseline}],sourceFiles),
    /SUPABASE_MIGRATION_CANONICAL_IDENTITY_AMBIGUOUS/
  );
});

test('malformed version or name is never silently normalized',()=>{
  assert.throws(
    ()=>resolveTerminalMigrationIdentities([{version:'20261008',name:baseline}],sourceFiles),
    /SUPABASE_MIGRATION_IDENTITY_INVALID/
  );
  assert.throws(
    ()=>resolveTerminalMigrationIdentities([{version:'20261008080905',name:'unsafe/name'}],sourceFiles),
    /SUPABASE_MIGRATION_IDENTITY_INVALID/
  );
});

test('unmapped exact history remains explicit for mandatory provider readback',()=>{
  const x={version:'20261008020000',name:'not_yet_in_current_main_v1'};
  assert.deepEqual(resolveTerminalMigrationIdentities([x],sourceFiles),[x]);
});

test('terminal workflow owns one canonical import and retains required production gates',()=>{
  const yaml=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(yaml,/import \{ resolveTerminalMigrationIdentities \} from '\.\/tools\/delivery\/terminal-migration-identity\.mjs'/);
  assert.match(yaml,/const canonical=resolveTerminalMigrationIdentities\(unique,currentMigrationPaths\)/);
  assert.doesNotMatch(yaml,/const canonical=unique\.map\(item=>/);
  assert.match(yaml,/Derive exact Supabase production migration identities across supersession lineage/);
  assert.match(yaml,/PRODUCTION_DESCENDANT_READBACK_PROVEN/);
  assert.match(yaml,/require_workflow "codeql\.yml" "Powerhouse-CodeQL"/);
});
