import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const prefix=new URL('../supabase/migrations/',import.meta.url);
const digest=s=>createHash('sha256').update(s).digest('hex');
const actual='f267cda0725f4020c47e4ec6511e84a4f4e527327f1b417490a80564f74fb521';
test('repository preserves the exact actual provider-applied migration identity and bytes',()=>{
 const applied=readFileSync(new URL('20261019203052_growth_source_daily_measurement.sql',prefix));
 assert.equal(digest(applied),actual);
});
test('already preview-applied compatibility revision stays immutable and idempotent',()=>{
 const compatibility=readFileSync(new URL('20261019223000_growth_source_daily_measurement.sql',prefix),'utf8');
 assert.equal(digest(compatibility),actual);
 assert.match(compatibility,/create table if not exists public\.powerhouse_growth_source_daily_v1/i);
 assert.match(compatibility,/create or replace function public\.powerhouse_capture_growth_source_daily_v1/i);
 assert.match(compatibility,/'powerhouse-growth-source-health-6h-v1'/);
 assert.doesNotMatch(compatibility,/insert into supabase_migrations|delete from supabase_migrations|update supabase_migrations/i);
});
