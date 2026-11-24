import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hasDocumentedCommercialEmailAuthority,assessHumanOutreachCopy}
  from '../supabase/functions/_shared/outreach-human-copy-guard.mjs';

const sql=fs.readFileSync(
  new URL('../docs/changes/2026-11-24-original-email-recipient-authority-reviewed-source.sql',import.meta.url),'utf8');
const composer=fs.readFileSync(
  new URL('../supabase/functions/powerhouse-commercial-message-composer/index.ts',import.meta.url),'utf8');
const sender=fs.readFileSync(
  new URL('../supabase/functions/powerhouse-autonomous-outreach/index.ts',import.meta.url),'utf8');
const approved={basis:'explicit_opt_in',granted:true,purpose:'commercial_email',
  granted_at:'2026-11-20T09:00:00Z',evidence_ref:'crm:2026:proof:authorization-001'};
test('a LinkedIn connection, CRM internal approval and email alone do not create recipient permission',()=>{
  assert.equal(hasDocumentedCommercialEmailAuthority({human_approved:true,bron:'linkedin-export'}),false);
  assert.equal(hasDocumentedCommercialEmailAuthority({human_approved:true,
    email_marketing_permission:{...approved,granted:false}}),false);
  assert.equal(hasDocumentedCommercialEmailAuthority({human_approved:true,
    email_marketing_permission:approved}),true);
  assert.equal(hasDocumentedCommercialEmailAuthority({human_approved:true,
    email_marketing_permission:approved,approval_revoked:true}),false);
});
test('old relationship email producer now fails closed before preparing actions',()=>{
  const start=sql.toLowerCase().indexOf("create or replace function public.powerhouse_prepare_connection_relationship_email_v1");
  const permission=sql.indexOf("and jsonb_typeof(c.extra->'email_marketing_permission')='object'",start);
  const createAction=sql.indexOf("insert into public.powerhouse_sales_actions",start);
  assert.ok(start>=0&&permission>start&&permission<createAction);
  for(const key of ['human_approved','explicit_opt_in','commercial_email','existing_customer_soft_opt_in',
    'similar_products_or_services','opt_out_offered_at_collection','opt_out_available_now',
    'evidence_ref','transaction_ref','pg_input_is_valid','approval_revoked','powerhouse_email_contact_suppressions',
    'negative_reply',"interval '30 days'",'NO_NEW_AUTHORIZED_PREPARED_RECIPIENT'])
    assert.ok(sql.includes(key),key);
  assert.match(sql,/REVOKE ALL ON FUNCTION public\.powerhouse_prepare_connection_relationship_email_v1/);
  assert.match(sql,/GRANT EXECUTE ON FUNCTION public\.powerhouse_prepare_connection_relationship_email_v1\(date,integer\) TO service_role/);
  assert.doesNotMatch(sql,/cron\.schedule|net\.http_post|GMAIL_SEND_EMAIL|CREATE TABLE/i);
});
test('composer screens exact CRM person + address + permission before any charged AI generation',()=>{
 const start=composer.indexOf('for(const action of rows){');
 const read=composer.indexOf("const {data:authority,error:authorityError}",start);
 const contract=composer.indexOf('hasDocumentedCommercialEmailAuthority(authority.extra)',start);
 const pay=composer.indexOf('const gen=await generate(db,apiKey',start);
 assert.ok(start>=0&&read>start&&contract>read&&pay>contract);
 assert.match(composer,/\.eq\('sleutel',personKey\)/);
 assert.match(composer,/\.eq\('email',recipient\)/);
 assert.match(composer,/model_generated:false,external_outreach_executed:false/);
 assert.match(composer,/status:'RECIPIENT_AUTHORITY_UNVERIFIED'/);
 assert.match(composer,/zonder vervolgafspraak/);
});
test('original last-mile sender still re-verifies source, permission, copy, suppression and readback',()=>{
 for(const key of ['verifyRecipientAuthority','hasDocumentedCommercialEmailAuthority',
  'providerUncertaintyNoResend','HUMAN_OUTREACH_COPY_REJECTED',
  'CONTACT_SUPPRESSED','RECIPIENT_CONTACT_PRESSURE_14D','verifiedGmailReadback',
  'GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID','SEND_OUTCOME_AMBIGUOUS_NO_RESEND'])
  assert.ok(sender.includes(key),key);
});
test('copy guard rejects artificial no-meeting promise even when copy is personalized',()=>{
 const action={role:'Manager',company_name:'Example',evidence:{
  public_source_evidence:{evidence:{headline:'Example introduceert een nieuwe integratieaanpak voor systemen'}}
 }};
 const output={subject:'Een vraag over jullie integraties',
  message:'Hoi, ik zag de aankondiging en vraag me af hoe jullie het organiseren, zonder vervolgafspraak.',
  personalization_anchor:'integratieaanpak'};
 const result=assessHumanOutreachCopy(action,{},output);
 assert.ok(result.reasons.includes('FAKE_NO_MEETING_ASSURANCE'));
});

test('original source-trigger retains send_forbidden on terminal unauthorized actions',()=>{
 const n=sql.indexOf('CREATE OR REPLACE FUNCTION public.powerhouse_require_source_for_direct_outreach_v1');
 assert.ok(n>0,'existing original source guard must be kept');
 const guard=sql.slice(n);
 assert.match(guard,/v_original_research_wait/);
 assert.match(guard,/new\.status in \('expired','skipped','failed','cancelled'\)/);
 assert.match(guard,/authority_quarantine,reason/);
 assert.match(guard,/RECIPIENT_AUTHORITY_UNVERIFIED/);
 assert.match(guard,/GRANT EXECUTE ON FUNCTION public\.powerhouse_require_source_for_direct_outreach_v1\(\) TO service_role/);
 assert.match(guard,/REVOKE ALL ON FUNCTION public\.powerhouse_require_source_for_direct_outreach_v1\(\) FROM PUBLIC,anon,authenticated/);
});
