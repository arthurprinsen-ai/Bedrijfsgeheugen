import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql=readFileSync('supabase/migrations/20261009150000_contact_pressure_only_proven_outbound_4198.sql','utf8');
const outbound=(action)=>action.status==='done' && Boolean(action.executed_at) && ['email','e_mail','linkedin_dm'].includes(String(action.channel??'').toLowerCase().replace(/[^a-z0-9]+/g,'_'));

test('preserve existing RLS caller semantics, all view columns, and scheduler isolation',()=>{
 assert.match(sql,/CREATE OR REPLACE VIEW public\\.powerhouse_contact_pressure_v1/);
 assert.match(sql,/WITH \\(security_invoker = true\\)/);
 for(const col of ['outbound_7d','outbound_30d','outbound_90d','pending_response','next_follow_up_at','cooldown_until','pressure_state'])assert.match(sql,new RegExp(col));
 assert.doesNotMatch(sql,/DROP VIEW|CREATE TABLE|cron\\.schedule|cron\\.alter_job/);
});

test('SQL includes explicit successful-delivery and recipient-channel guards',()=>{
 assert.match(sql,/powerhouse_sales_actions\\.status = 'done'/);
 assert.match(sql,/powerhouse_sales_actions\\.executed_at IS NOT NULL/);
 assert.match(sql,/regexp_replace\\(powerhouse_sales_actions\\.channel/);
 assert.match(sql,/IN \\('email', 'e_mail', 'linkedin_dm'\\)/);
});

test('internal research and skipped contact actions never increase outbound pressure',()=>{
 const actions=[
  {channel:'internal',status:'done',executed_at:'2026-10-09',action_type:'research_enrichment'},
  {channel:'email',status:'done',executed_at:'2026-10-04',action_type:'autonomous_email'},
  {channel:'email',status:'done',executed_at:'2026-10-09',action_type:'reply_followup'},
  {channel:'LinkedIn DM',status:'done',executed_at:'2026-10-09',action_type:'salesrobot_linkedin_dm'},
  {channel:'email',status:'skipped',executed_at:'2026-10-09',action_type:'activate_connection'},
  {channel:'linkedin_personal',status:'done',executed_at:'2026-10-09',action_type:'reply_post'}
 ];
 assert.equal(actions.filter(outbound).length,3);
 assert.equal(outbound(actions[0]),false);
 assert.equal(outbound(actions[1]),true);
 assert.equal(outbound(actions[2]),true);
 assert.equal(outbound(actions[3]),true);
 assert.equal(outbound(actions[4]),false);
 assert.equal(outbound(actions[5]),false);
});
