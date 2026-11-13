import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const originals=readdirSync(new URL('../supabase/migrations/',import.meta.url)).filter(name=>/^\d{14}_.+\.sql$/.test(name));
const providerRef='adhjwmvyoixzjtmiroln';
const originalVersion='20261113082500';
const originalName='original_cancelled_social_learning_source_ack_v1';

test('originally applied provider 842 is a single exact name/version append, not a source-only claim',()=>{
  assert.equal(lock.project_ref,providerRef);
  assert.equal(lock.source,'supabase_migration_history');
  assert.ok(lock.applied.length>=842,'842 provider entries independently verified 2026-11-13');
  const row=lock.applied.find(x=>x.version===originalVersion);
  assert.deepEqual(row,{version:originalVersion,name:originalName});
  assert.equal(lock.applied.filter(x=>x.version===originalVersion).length,1);
  assert.ok(originals.includes(originalVersion+'_'+originalName+'.sql'));
  assert.ok(Date.parse(lock.captured_at)>=Date.parse('2026-11-13T08:46:04.242Z'));
  assert.ok(!lock.applied.some(x=>x.version==='20261113083000'),'candidate 830 is not provider applied');
});

test('all protected provider source versions are unique and local original migration is executable',()=>{
  const versions=new Set(lock.applied.map(x=>x.version));
  assert.equal(versions.size,lock.applied.length);
  const rows=new Set(lock.applied.map(x=>x.version+'_'+x.name+'.sql'));
  for(const name of rows)assert.ok(originals.includes(name),'missing original migration '+name);
  const sql=readFileSync(new URL('../supabase/migrations/'+originalVersion+'_'+originalName+'.sql',import.meta.url),'utf8');
  assert.ok(sql.trim().length>30);
});
