import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveTerminalMigrationIdentities, verifyRetiredMigrationSupersession} from '../tools/delivery/terminal-migration-identity.mjs';

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
  assert.match(yaml,/import \{ resolveTerminalMigrationIdentities, verifyRetiredMigrationSupersession \} from '\.\/tools\/delivery\/terminal-migration-identity\.mjs'/);
  const stepStart=yaml.indexOf('      - name: Derive exact Supabase production migration identities across supersession lineage');
  const stepEnd=yaml.indexOf('      - name: ',stepStart+12);
  assert.ok(stepStart>=0 && stepEnd>stepStart,'Terminal migration step must have a bounded scope');
  const step=yaml.slice(stepStart,stepEnd);
  const scriptStart=step.indexOf("node --input-type=module - <<'NODE'");
  const scriptEnd=step.indexOf('\n          NODE',scriptStart);
  assert.ok(scriptStart>=0 && scriptEnd>scriptStart,'Migration step needs its own executable heredoc');
  const script=step.slice(scriptStart,scriptEnd);
  assert.match(script,/import \{ resolveTerminalMigrationIdentities, verifyRetiredMigrationSupersession \} from '\.\/tools\/delivery\/terminal-migration-identity\.mjs'/,
    'The resolver must be in the same Node heredoc as its invocation');
  assert.match(script,/const canonical=resolveTerminalMigrationIdentities\(unique,currentMigrationPaths\)/);
  assert.equal((yaml.match(/import \{ resolveTerminalMigrationIdentities, verifyRetiredMigrationSupersession \}/g)||[]).length,1,
    'Prevent importing resolver in an unrelated terminal step');

  assert.match(yaml,/const canonical=resolveTerminalMigrationIdentities\(unique,currentMigrationPaths\)/);
  assert.doesNotMatch(yaml,/const canonical=unique\.map\(item=>/);
  assert.match(yaml,/Derive exact Supabase production migration identities across supersession lineage/);
  assert.match(yaml,/PRODUCTION_DESCENDANT_READBACK_PROVEN/);
  assert.match(yaml,/require_workflow "codeql\.yml" "Powerhouse-CodeQL"/);
});

const shaA='a'.repeat(40);
const shaB='b'.repeat(40);
const migration='supabase/migrations/20261022173500_brain_failure_observe_semantic_guard_v1.sql';
const adopted={ [migration]:{sha:shaB,source_pr:4697} };
const onMain={ [migration]:shaB };
const retired={retiredPrNumber:4686,retiredState:'closed',retiredMerged:false,
  retiredBody:'Writer-Lease-State: SUPERSEDED',
  successorPrNumber:4697,successorBody:'Supersedes: 4686',
  migrationFiles:[{filename:migration,sha:shaA,status:'modified'}],
  mergedMigrationBlobs:adopted,currentMainBlobs:onMain};

test('RED→GREEN #4686→#4697: retired draft SQL replaced by exact protected merged successor',()=>{
  const [proof]=verifyRetiredMigrationSupersession(retired);
  assert.equal(proof.path,migration);
  assert.equal(proof.adopted_pr,4697);
  assert.equal(proof.retired_blob_identical,false);
  assert.equal(proof.source_sha,shaB);
});

test('bit-identical retired SQL also requires explicit owner and source proof',()=>{
  assert.equal(verifyRetiredMigrationSupersession({
    ...retired,migrationFiles:[{filename:migration,sha:shaB}]
  })[0].retired_blob_identical,true);
  assert.throws(()=>verifyRetiredMigrationSupersession({...retired,successorBody:'Supersedes: 9999'}),
    /OWNER_LINK_UNPROVEN/);
  assert.throws(()=>verifyRetiredMigrationSupersession({...retired,retiredBody:'Writer-Lease-State: CANDIDATE_ACTIVE'}),
    /OWNER_LINK_UNPROVEN/);
});

test('non-adopted migration, new version and drifting main source fail closed',()=>{
  assert.throws(()=>verifyRetiredMigrationSupersession({...retired,mergedMigrationBlobs:{}}),
    /NOT_ADOPTED/);
  assert.throws(()=>verifyRetiredMigrationSupersession({
    ...retired,migrationFiles:[{filename:'supabase/migrations/20261022190500_new_unmerged_v2.sql',sha:shaA}]
  }),/NOT_ADOPTED/);
  assert.throws(()=>verifyRetiredMigrationSupersession({
    ...retired,currentMainBlobs:{[migration]:shaA}
  }),/SOURCE_DRIFT/);
  assert.throws(()=>verifyRetiredMigrationSupersession({
    ...retired,migrationFiles:[{filename:'supabase/migrations/invalid.sql',sha:shaA}]
  }),/IDENTITY_INVALID/);
  assert.throws(()=>verifyRetiredMigrationSupersession({
    ...retired,retiredState:'open'
  }),/PREDECESSOR_NOT_RETIRED/);
});

test('terminal job retains live provider/ACL proof and uses single bounded successor verifier',()=>{
  const yaml=readFileSync('.github/workflows/obligation-terminal-closure.yml','utf8');
  assert.match(yaml,/const proof=verifyRetiredMigrationSupersession\(/);
  assert.match(yaml,/SUPERSEDES_MERGED_MIGRATION_CONFLICT/);
  assert.match(yaml,/SUPABASE_ONLY_PROVIDER_READBACK_REQUIRED/);
  assert.match(yaml,/MIGRATION_READBACK_REQUIRED/);
  assert.match(yaml,/CONTROL_PLANE_DURABLE_READBACK_REJECTED/);
  assert.match(yaml,/const canonical=resolveTerminalMigrationIdentities\(unique,currentMigrationPaths\)/);
});
