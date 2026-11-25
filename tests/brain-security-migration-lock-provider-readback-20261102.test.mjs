import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('source lock includes exactly one current security hardening migration with source proof',async()=>{
 const lock=JSON.parse(await readFile('supabase/migration-history.lock.json','utf8'));
 const rows=lock.applied||[];
 const expected={version:'20261102141045',name:'writer_control_fixed_search_path_v1'};
 const matches=rows.filter(x=>x.version===expected.version);
 assert.equal(matches.length,1,'duplicate migration version or omitted production migration');
 assert.equal(matches[0].name,expected.name,'provider migration name drift');
 assert.ok(rows.length>=791,'older source lock presented as current');
 assert.equal(rows.findIndex(x=>x.version===expected.version),790,'historical 790-row prefix must remain intact');
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(Number.isFinite(Date.parse(lock.captured_at)),'captured_at must be auditable');
 const sql=await readFile('supabase/migrations/20261102141045_writer_control_fixed_search_path_v1.sql','utf8');
 for(const method of ['acquire','verify','release']) assert.ok(sql.includes('writer_control.'+method),method);
 assert.match(sql,/pg_catalog\s*,\s*writer_control/i);
});

test('source lock remains unique and chronologically sorted, no invented migration replays',async()=>{
 const lock=JSON.parse(await readFile('supabase/migration-history.lock.json','utf8'));
 const rows=lock.applied;
 const versions=rows.map(x=>x.version);
 assert.equal(new Set(versions).size,rows.length,'migration identity duplicate');
 for(let i=1;i<versions.length;i++)assert.ok(versions[i]>=versions[i-1],`migration order drift ${i}`);
});
