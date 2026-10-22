import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261022150000_powerhouse_health_weekly_cron_cadence_v1.sql',import.meta.url),'utf8');
const weekly=/^[0-5]?[0-9] ([01]?[0-9]|2[0-3]) \* \* [0-6]$/;
const daily=/^\d+ \d+ \* \* \*$/;
function status({schedule,lastStatus,lastRun},now) {
 if (!lastRun) return 'fout';
 if (lastStatus!=='succeeded') return 'fout';
 const age=now.getTime()-lastRun.getTime();
 if (daily.test(schedule) && age>26*3600e3) return 'fout';
 if (weekly.test(schedule)) return age> (7*24+2)*3600e3?'waarschuwing':'ok';
 return age>74*3600e3?'waarschuwing':'ok';
}
test('patches the existing canonical health function only; does not schedule new jobs',()=>{
 assert.ok(sql.includes("pg_get_functiondef('public.bg_gezondheid_meten()'::regprocedure)"));
 assert.ok(sql.includes("EXECUTE replace(v_definition,v_old,v_new)"));
 assert.ok(sql.includes("HEALTH_WEEKLY_SOURCE_SIGNATURE_DRIFT"));
 assert.ok(sql.includes("HEALTH_WEEKLY_CANONICAL_SECURITY_DRIFT"));
 assert.ok(sql.includes("HEALTH_WEEKLY_POSTWRITE_READBACK_FAILED"));
 assert.doesNotMatch(sql,/\bcron\.(schedule|alter_job|unschedule)\s*\(/i);
 assert.doesNotMatch(sql,/\bDROP\s+(?:FUNCTION|VIEW|TABLE)\b/i);
});
test('no-run and failed executions remain errors, including weekly',()=>{
 const now=new Date('2026-10-22T13:00:00Z');
 assert.equal(status({schedule:'0 6 * * 1',lastStatus:'succeeded',lastRun:null},now),'fout');
 assert.equal(status({schedule:'0 6 * * 1',lastStatus:'failed',lastRun:new Date('2026-10-19T06:00:00Z')},now),'fout');
});
test('a successful Monday weekly job is not stale on Thursday',()=>{
 const now=new Date('2026-10-22T13:00:00Z');
 assert.equal(status({schedule:'0 6 * * 1',lastStatus:'succeeded',lastRun:new Date('2026-10-19T06:00:00Z')},now),'ok');
 assert.equal(status({schedule:'40 6 * * 1',lastStatus:'succeeded',lastRun:new Date('2026-10-19T06:40:00Z')},now),'ok');
});
test('missing the next weekly execution becomes warning after two-hour grace',()=>{
 assert.equal(status({schedule:'0 6 * * 1',lastStatus:'succeeded',lastRun:new Date('2026-10-19T06:00:00Z')},new Date('2026-10-26T08:01:00Z')),'waarschuwing');
 assert.equal(status({schedule:'40 6 * * 1',lastStatus:'succeeded',lastRun:new Date('2026-10-19T06:40:00Z')},new Date('2026-10-26T08:41:00Z')),'waarschuwing');
});
test('daily and non-weekly conservative thresholds unchanged',()=>{
 const now=new Date('2026-10-22T13:00:00Z');
 assert.equal(status({schedule:'0 6 * * *',lastStatus:'succeeded',lastRun:new Date('2026-10-21T06:00:00Z')},now),'fout');
 assert.equal(status({schedule:'*/5 * * * *',lastStatus:'succeeded',lastRun:new Date('2026-10-18T06:00:00Z')},now),'waarschuwing');
});
test('migration contains exact production guard order and privileges',()=>{
 for(const x of ["r.laatste_run is null then 'fout'","r.laatste_status<>'succeeded' then 'fout'","'26 hours'","'7 days 2 hours'","'74 hours'","'search_path=public, cron, net'","has_function_privilege('service_role'"]) assert.ok(sql.includes(x),x);
});
