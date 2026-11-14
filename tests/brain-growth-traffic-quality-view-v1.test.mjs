import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync(new URL('../supabase/migrations/20261028071500_growth_traffic_quality_v1.sql',import.meta.url),'utf8');

test('historical replay: views classify verified humans, flagged robots, probable bots and the rest',()=>{
  for(const cls of ['robot_flagged','verified_human','probable_bot','unverified'])assert.match(sql,new RegExp(`'${cls}'`));
  assert.match(sql,/page_views >= 8/);
  assert.match(sql,/'engaged_view'[\s\S]*'scan_completed'/);
});

test('shadow: read-only, invoker security and no public access',()=>{
  assert.doesNotMatch(sql,/\b(insert|update|delete|drop|truncate|alter)\b\s/i);
  assert.equal((sql.match(/security_invoker = true/g)||[]).length,2);
  assert.match(sql,/revoke all on public\.powerhouse_growth_traffic_quality_v1 from public, anon, authenticated/);
  assert.match(sql,/revoke all on public\.powerhouse_growth_traffic_quality_daily_v1 from public, anon, authenticated/);
  assert.match(sql,/grant select on public\.powerhouse_growth_traffic_quality_v1 to service_role/);
});

test('canary: no personal data columns are exposed',()=>{
  assert.doesNotMatch(sql,/\b(email|ip|user_agent|name|phone)\b/i);
  assert.match(sql,/from public\.growth_events/);
});
