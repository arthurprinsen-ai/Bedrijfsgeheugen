import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261027171500_connection_email_activation_v1.sql',import.meta.url),'utf8');
test('only approved-email connections are routed to the canonical autonomous email transport',()=>{
 assert.match(sql,/extra->>'human_approved',''\)='true'/);
 assert.match(sql,/powerhouse_email_contact_suppressions/);
 assert.match(sql,/'autonomous_email','email'/);
 assert.match(sql,/'prepared'/);
 assert.match(sql,/least\(coalesce\(p_cap,5\),5\)/);
 assert.match(sql,/interval '30 days'/);
});
test('nothing is sent and no new scheduler is created',()=>{
 assert.doesNotMatch(sql,/cron\.schedule|http_post|net\.http/i);
 assert.match(sql,/'external_send_executed',false/);
});
test('existing daily activation job calls the email activation and keeps the predictive path',()=>{
 assert.match(sql,/v_email:=public\.powerhouse_prepare_connection_email_activation_v1\(p_run_date,5\)/);
 assert.match(sql,/'predictive-activation:'/);
 assert.match(sql,/revoke all on function public\.powerhouse_prepare_connection_email_activation_v1/);
});
