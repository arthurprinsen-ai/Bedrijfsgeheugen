import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync('supabase/migrations/20261106130000_powerhouse_missed_publication_incident_v1.sql','utf8');
test('missed publications become one incident per date and channel via the existing failure registry',()=>{
 assert.match(sql,/powerhouse_missed_publication_v1\(p_now, 3\)/);
 assert.match(sql,/brain_observe_failure\(/);
 assert.match(sql,/'missed-publication:' \|\| \(m->>'publication_date'\) \|\| ':' \|\| \(m->>'channel'\)/);
 assert.match(sql,/'owner', m->>'owner'/);
 assert.match(sql,/revoke all on function public\.powerhouse_report_missed_publications_v1[^;]*from public, anon, authenticated/);
 assert.match(sql,/grant execute on function public\.powerhouse_report_missed_publications_v1[^;]*to service_role/);
});
test('wired into the existing hourly tick, isolated, with no second scheduler',()=>{
 assert.doesNotMatch(sql,/cron\.schedule/);
 const tick=sql.split('create or replace function public.powerhouse_content_closed_loop_tick_v1')[1];
 assert.ok(tick.indexOf('powerhouse_report_missed_publications_v1')<tick.indexOf('net.http_post'),'report runs before dispatch');
 assert.match(tick,/CONTENT_MISSED_PUBLICATION_REPORT_ISOLATED/);
 assert.match(tick,/CONTENT_LOOP_SCHEDULER_TOKEN_UNAVAILABLE/,'auth failures stay uncaught');
 assert.match(tick,/powerhouse_reconcile_content_outcomes_v1/);
 assert.match(tick,/powerhouse_measure_content_outcomes_v1/);
});
