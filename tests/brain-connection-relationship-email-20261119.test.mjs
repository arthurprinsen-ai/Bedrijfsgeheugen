import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/migrations/20261119090000_connection_relationship_email_activation_v1.sql',import.meta.url),'utf8');
test('only already approved recipients with role and company and a valid unsuppressed email',()=>{
 assert.match(sql,/extra->>'human_approved',''\)='true'/);
 assert.match(sql,/length\(btrim\(coalesce\(c\.rol,''\)\)\)>=3/);
 assert.match(sql,/length\(btrim\(coalesce\(c\.bedrijf,''\)\)\)>=2/);
 assert.match(sql,/powerhouse_email_contact_suppressions/);
 assert.match(sql,/'unsubscribe','opt_out','do_not_contact','complaint','negative_reply'/);
 assert.match(sql,/interval '30 days'/);
});
test('relationship facts go on the action, nothing is sent, no new scheduler',()=>{
 assert.match(sql,/'relationship_evidence',jsonb_build_object\('role',a\.role,'company_name',a\.company_name\)/);
 assert.match(sql,/'autonomous_email','email'/);
 assert.match(sql,/'prepared'/);
 assert.match(sql,/'external_send_executed',false/);
 assert.doesNotMatch(sql,/cron\.schedule|http_post|net\.http/i);
});
test('daily budget stays at five in total, predictive path first, predictive activation kept',()=>{
 assert.match(sql,/least\(coalesce\(p_cap,3\),5\)/);
 assert.match(sql,/v_left:=greatest\(0,5-coalesce\(\(v_email->>'prepared'\)::int,0\)\)/);
 assert.match(sql,/relationship_email\(p_run_date,least\(3,v_left\)\)|powerhouse_prepare_connection_relationship_email_v1\(p_run_date,least\(3,v_left\)\)/);
 assert.match(sql,/'predictive-activation:'/);
 assert.match(sql,/revoke all on function public\.powerhouse_prepare_connection_relationship_email_v1/);
});
