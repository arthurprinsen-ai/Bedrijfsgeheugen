import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const lock=JSON.parse(readFileSync(new URL('../supabase/migration-history.lock.json',import.meta.url),'utf8'));
const file='20261114091500_original_outreach_source_research_cooldown_scope_v2.sql';
const sql=readFileSync(new URL('../supabase/migrations/'+file,import.meta.url),'utf8');
test('native provider 854 version identity readback remains exact append of 853',()=>{
 assert.equal(lock.source,'supabase_migration_history');
 assert.equal(lock.project_ref,'adhjwmvyoixzjtmiroln');
 assert.ok(lock.applied.length>=854,'historical applied migration must survive future native migrations');
 assert.deepEqual(lock.applied[852],{version:'20261114083500',name:'original_approved_connection_source_priming_v1'});
 assert.deepEqual(lock.applied[853],{version:'20261114091500',name:'original_outreach_source_research_cooldown_scope_v2'});
 assert.equal(new Set(lock.applied.map(x=>x.version)).size,lock.applied.length);
 assert.equal(Date.parse(lock.captured_at)>=Date.parse('2026-11-14T08:52:15Z'),true);
});
test('actual native 854 cannot grant email send or add another scheduler',()=>{
 assert.match(sql,/create or replace function public\.powerhouse_prime_approved_connection_research_v1/);
 assert.match(sql,/public_research_execution,researched_at/);
 assert.match(sql,/relationship-research:approved-source:%/);
 assert.match(sql,/relationship-research:outreach-source:%/);
 assert.match(sql,/'external_side_effect_allowed',false/);
 assert.match(sql,/'provider_delivery_proven',false/);
 assert.match(sql,/from public,anon,authenticated/);
 assert.doesNotMatch(sql,/\bcron\.schedule\s*\(|\bnet\.http_post\s*\(/i);
});
