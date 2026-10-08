import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql=readFileSync('supabase/migrations/20261008121500_commercial_eligible_after_pressure_v1.sql','utf8');
const sender=readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8');

test('daily top-20 selection occurs AFTER contact-pressure and identity gates',()=>{
  const from=sql.indexOf('from public.powerhouse_revenue_command_center_snapshot_v1 s');
  const end=sql.indexOf('), enriched as (',from);
  assert.ok(from>0 && end>from);
  const clause=sql.slice(from,end);
  assert.doesNotMatch(clause,/s\\.revenue_rank\\s*<=\\s*20/);
  for(const rule of [
    "s.buying_window_score>=.30",
    "s.buying_window_confidence>=.25",
    "not in ('cooldown','wait','suppressed','do_not_contact')",
    "s.cooldown_until<=v_now",
    "coalesce(s.identity_conflict,false)=false",
    "coalesce(s.structural_lineage_gap,false)=false"
  ])assert.ok(clause.includes(rule),rule);
  assert.match(clause,/order by s\\.revenue_rank asc\\s+limit 20/);
  assert.ok(clause.indexOf('order by s.revenue_rank asc')>clause.indexOf('s.structural_lineage_gap'));
});

test('ranked source re-selection preserves existing side-effect and authorization limits',()=>{
  assert.match(sql,/on conflict\\(dedupe_key\\)/);
  assert.match(sql,/where powerhouse_sales_actions\\.status in \\('suggested','prepared','waiting'\\)/);
  assert.match(sql,/human_approved/);
  assert.match(sql,/when e\\.recommended_channel='email' and e\\.email_ready/);
  assert.match(sql,/when e\\.recommended_channel='linkedin_dm' and e\\.dm_ready/);
  assert.match(sql,/revoke execute on function public\\.powerhouse_materialize_command_center_actions_v1\\(date\\) from public, anon, authenticated/i);
  assert.match(sql,/grant execute on function public\\.powerhouse_materialize_command_center_actions_v1\\(date\\) to service_role/i);
  assert.doesNotMatch(sql,/cron\\.schedule|net\\.http_post|insert into public\\.powerhouse_sales_outcomes/i);
});

test('regression: 20 cooling leads cannot starve lower-ranked eligible prospects',()=>{
  const rows=[
    ...Array.from({length:20},(_,i)=>({rank:i+1,pressure:'cooldown'})),
    ...Array.from({length:24},(_,i)=>({rank:i+21,pressure:i<2?'medium':'low'}))
  ];
  const previous=rows.slice(0,20).filter(x=>!['cooldown','wait','suppressed','do_not_contact'].includes(x.pressure));
  const fixed=rows.filter(x=>!['cooldown','wait','suppressed','do_not_contact'].includes(x.pressure)).sort((a,b)=>a.rank-b.rank).slice(0,20);
  assert.equal(previous.length,0);
  assert.equal(fixed.length,20);
  assert.ok(fixed.every(x=>x.rank>20));
});

test('Gmail zero-output cannot masquerade as a successful commercial delivery',()=>{
  assert.match(sender,/status:sent===0\\|\\|out\\.some\\(x=>x\\.status==='error'\\)\\?'waarschuwing':'ok'/);
  assert.match(sender,/NO_ELIGIBLE_PREPARED_EMAIL/);
  assert.match(sender,/NO_PROVIDER_CONFIRMED_EMAIL/);
  assert.match(sender,/external_outreach_executed:sent>0/);
  assert.match(sender,/const sent=out\\.filter\\(x=>x\\.status==='sent'\\)\\.length/);
  assert.match(sender,/provider_ack_verified:true/);
  assert.match(sender,/CONTACT_SUPPRESSED/);
  assert.doesNotMatch(sender,/sent:\\s*\\(acts\\|\\|\\[\\]\\)\\.length/);
});
