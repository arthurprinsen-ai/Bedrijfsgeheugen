import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  parseMigrationPath,
  readbacksForMigrationPaths,
  mergeMigrationLines,
} from '../tools/supabase/publish-migration-provider-readback.mjs';

test('migration provider readback derives exact canonical identity from migration path',()=>{
  assert.deepEqual(
    parseMigrationPath('supabase/migrations/20261007182000_personal_linkedin_predictive_dream_journey_v1.sql'),
    {
      path:'supabase/migrations/20261007182000_personal_linkedin_predictive_dream_journey_v1.sql',
      version:'20261007182000',
      name:'personal_linkedin_predictive_dream_journey_v1',
    },
  );
  assert.throws(()=>parseMigrationPath('supabase/migrations/not-canonical.sql'),/SUPABASE_MIGRATION_PATH_INVALID/);
});

test('migration provider readback accepts wrapped migration history shapes',()=>{
  const paths=['supabase/migrations/20261007182000_personal_linkedin_predictive_dream_journey_v1.sql'];
  for(const payload of [
    [{version:'20261007182000',name:'personal_linkedin_predictive_dream_journey_v1'}],
    {migrations:[{version:'20261007182000',name:'personal_linkedin_predictive_dream_journey_v1'}]},
    {data:[{version:'20261007182000',name:'personal_linkedin_predictive_dream_journey_v1'}]},
  ]){
    const rows=readbacksForMigrationPaths(
      payload,
      paths,
      {projectRef:'adhjwmvyoixzjtmiroln',observedAt:'2026-10-07T20:08:25Z'},
    );
    assert.equal(rows[0].state,'APPLIED');
  }
});

test('migration provider readback requires exact remote version and name',()=>{
  const paths=['supabase/migrations/20261007182000_personal_linkedin_predictive_dream_journey_v1.sql'];
  const readbacks=readbacksForMigrationPaths(
    [{version:'20261007182000',name:'personal_linkedin_predictive_dream_journey_v1'}],
    paths,
    {projectRef:'adhjwmvyoixzjtmiroln',observedAt:'2026-10-07T20:08:25Z'},
  );
  assert.deepEqual(readbacks,[{
    path:paths[0],
    version:'20261007182000',
    name:'personal_linkedin_predictive_dream_journey_v1',
    state:'APPLIED',
    project:'adhjwmvyoixzjtmiroln',
    observed_at:'2026-10-07T20:08:25Z',
  }]);
  assert.throws(
    ()=>readbacksForMigrationPaths(
      [{version:'20261007182000',name:'wrong_name'}],
      paths,
      {projectRef:'adhjwmvyoixzjtmiroln',observedAt:'2026-10-07T20:08:25Z'},
    ),
    /SUPABASE_MIGRATION_PROVIDER_HISTORY_MISSING/,
  );
});

test('migration marker writeback is idempotent for the same migration identity',()=>{
  const prior=[
    'Obligation-ID: example',
    '',
    'Terminal-Supabase-Migration-Readback: version=20261007182000;name=personal_linkedin_predictive_dream_journey_v1;state=APPLIED;project=adhjwmvyoixzjtmiroln;observed_at=2026-10-07T19:00:00Z',
    'Terminal-Supabase-Provider-Readback: function=example;version=1;runtime_sha256='+'a'.repeat(64),
  ].join('\n');
  const next=mergeMigrationLines(prior,[{
    version:'20261007182000',
    name:'personal_linkedin_predictive_dream_journey_v1',
    state:'APPLIED',
    project:'adhjwmvyoixzjtmiroln',
    observed_at:'2026-10-07T20:08:25Z',
  }]);
  assert.equal((next.match(/Terminal-Supabase-Migration-Readback:/g)||[]).length,1);
  assert.match(next,/observed_at=2026-10-07T20:08:25Z/);
  assert.match(next,/Terminal-Supabase-Provider-Readback: function=example/);
});

test('production authority auto-publishes migration readback and terminalizer waits boundedly',async()=>{
  const [authority,terminalizer]=await Promise.all([
    readFile('.github/workflows/supabase-edge-production-authority.yml','utf8'),
    readFile('.github/workflows/powerhouse-obligation-terminalizer.yml','utf8'),
  ]);

  assert.match(authority,/supabase\/migrations\/\*\*/);
  assert.match(authority,/Resolve exact migration set/);
  assert.match(authority,/publish-migration-provider-readback\.mjs/);
  assert.match(authority,/SUPABASE_ACCESS_TOKEN/);
  assert.match(authority,/SUPABASE_MIGRATION_TARGET_PR_MISSING/);
  assert.ok(
    authority.indexOf('Publish exact migration provider readback evidence to merged PR') <
      authority.indexOf('Prove byte-for-byte provider source parity'),
    'migration readback must publish before slower Edge provider parity',
  );

  assert.match(terminalizer,/migration_complete=false/);
  assert.match(terminalizer,/for attempt in \$\(seq 1 24\)/);
  assert.match(terminalizer,/Waiting for canonical Supabase migration provider readback/);
  assert.match(terminalizer,/sleep 5/);
  assert.match(terminalizer,/SUPABASE_MIGRATION_PROVIDER_READBACK_MISSING/);
});
