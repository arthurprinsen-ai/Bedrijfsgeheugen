import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {eligiblePublicCompanyPage,publishedBusinessMailto,publicCompanyContactPaths,samePublicCompanyRedirect} from '../supabase/functions/_shared/public-business-email-evidence.mjs';

const at=new Date().toISOString();
const html='<html><title>Acme Research | Team</title><main><h1>Acme Research</h1><p>Jane Doe, Director <a href="mailto:jane@acmeresearch.com">Email Jane</a></p></main></html>';
const proof=()=>publishedBusinessMailto({html,sourceUrl:'https://www.acmeresearch.com/team',personName:'Jane Doe',companyName:'Acme Research',observedAt:at});
test('one explicitly published, closely name-linked work mailto on company domain is source evidence, never send proof',()=>{
 const e=proof();
 assert.equal(e?.email,'jane@acmeresearch.com');
 assert.equal(e?.classification,'EXPLICIT_PERSON_WORK_MAILTO');
 assert.equal(e?.deliverability,'UNVERIFIED');
 assert.equal(e?.send_authority,'NOT_INFERRED');
 assert.equal(e?.confidence,0.9);
});
test('reject guesses, private mailbox, generic inbox, wrong identity, company mismatch and unrelated or internal sites',()=>{
 const fields={sourceUrl:'https://www.acmeresearch.com/team',personName:'Jane Doe',companyName:'Acme Research',observedAt:at};
 assert.equal(publishedBusinessMailto({...fields,html:'Acme Research Jane Doe jane@acmeresearch.com'}),null,'no explicit mailto');
 assert.equal(publishedBusinessMailto({...fields,html:html.replace('jane@acmeresearch.com','jane@gmail.com')}),null);
 assert.equal(publishedBusinessMailto({...fields,html:html.replace('jane@acmeresearch.com','info@acmeresearch.com')}),null);
 assert.equal(publishedBusinessMailto({...fields,personName:'John Doe',html}),null);
 assert.equal(publishedBusinessMailto({...fields,companyName:'Elsewhere Inc',html}),null);
 assert.equal(publishedBusinessMailto({...fields,sourceUrl:'https://linkedin.com/in/jane-doe',html}),null);
 assert.equal(publishedBusinessMailto({...fields,sourceUrl:'https://127.0.0.1/team',html}),null);
 assert.equal(eligiblePublicCompanyPage('https://www.acmeresearch.com/team','Acme Research'),true);
 assert.equal(eligiblePublicCompanyPage('https://www.example.com/team','Acme Research'),false);
});
test('person identity inside script, style or a malformed script closing tag is never accepted as published identity',()=>{
 const fields={sourceUrl:'https://www.acmeresearch.com/team',personName:'Jane Doe',companyName:'Acme Research',observedAt:at};
 for(const bad of [
  '<main>Acme Research<script>Jane Doe</script\\t\\n bar><a href="mailto:jane@acmeresearch.com">Email</a></main>',
  '<main>Acme Research<style>Jane Doe</style><a href="mailto:jane@acmeresearch.com">Email</a></main>',
  '<main>Acme Research<template>Jane Doe</template><a href="mailto:jane@acmeresearch.com">Email</a></main>'
 ]){
   assert.equal(publishedBusinessMailto({...fields,html:bad}),null,
     'script/style/template content is not human-visible name evidence');
 }
});
test('original authorized worker is the only writer; its receiver records INGEST_ACK but NOT consumer PROCESSED',()=>{
 const src=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');
 assert.match(src,/ingestPublicWorkEmail\(db,action,organic,observedAt\)/);
 assert.match(src,/public_work_email_candidate:{...lineage,email:evidence.email/);
 assert.match(src,/PUBLIC_EMAIL_CANONICAL_WRITE/);
 assert.match(src,/PUBLIC_EMAIL_ORIGINAL_EVENT_ACK/);
 assert.match(src,/CANDIDATE_INGEST_ACK_CONSUMER_PROCESSED_PENDING/);
 assert.match(src,/public_email_consumer_processed:'NOT_PROVEN'/);
 assert.match(src,/canonical_email_written:false/);
 assert.match(src,/contact_approval_evidenced:isTrue\(contact\.extra\?\.human_approved\)/);
 assert.doesNotMatch(src,/contact_approval_evidenced:true/,'no falsely inferred contact approval');
 assert.doesNotMatch(src,/email:evidence\.email,extra:/,'do not populate sender-visible email without deliverability or lawful channel checks');
 assert.match(src,/Object\.hasOwn\(contact\.extra\|\|\{\},'approval_revoked'\)/);
 assert.match(src,/Object\.hasOwn\(c\.extra\|\|\{\},'approval_revoked'\)/);
 assert.doesNotMatch(src,/isTrue\(contact\.extra\?\.approval_revoked\)/);
 assert.match(src,/isTrue\(contact\.extra\?\.opt_out\)/);
 assert.match(src,/originalFirstPartyDomainCandidatePass\(db,observedAt\)/);
 assert.match(src,/first_party_company_domain/);
 assert.match(src,/FIRST_PARTY_DAILY_CAP_READ/);
 assert.match(src,/FIRST_PARTY_RESEARCH_DISPOSITION_ACK/);
 assert.match(src,/writePublicBusinessSourceReceipt/);
 assert.match(src,/SOURCE_CANDIDATE_RECEIPT_REPLAY/);
 assert.match(src,/ignoreDuplicates:true/,'duplicate producer replay cannot regress original consumer PROCESSED state');
 assert.match(src,/PUBLIC_EMAIL_ORIGINAL_EVENT_SOURCE_REVISION_CONFLICT/);
 assert.match(src,/source_receipt_recovered_from_canonical:recovered/);
 assert.match(src,/result\.receipts>0/,'canonical candidate replay with source ACK completes same original research action');

 assert.match(src,/public_email_source_checked:checked/);
 assert.match(src,/public_email_next_attempt_at:nextAttemptAt/);
 assert.match(src,/if\(prior\?\.evidence\?\.public_email_source_checked===true\)continue/);
 assert.doesNotMatch(src,/if\(!remaining\)return/,'a full eight-slot day must still retry incomplete source ACKs');

 assert.match(src,/new_provider_queries:0/);
 assert.match(src,/CANDIDATE_INGEST_ACK_CONSUMER_PROCESSED_PENDING/);
 assert.doesNotMatch(src,/if\(!contact\|\|!isTrue\(contact\.extra\?\.human_approved\)/,
   'lawful public source research is independent from recipient email send authorization');
 assert.match(src,/powerhouse_email_contact_suppressions/);
 assert.match(src,/provider_send_authorized:false/);
 assert.match(src,/external_messages_sent:0/);
 assert.doesNotMatch(src,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|HUNTER_EMAIL_FINDER|APOLLO_PEOPLE_ENRICHMENT/i);
});

test('original #116 research dispatch includes free first-party no-email candidates even without another due paid SERP job',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261114211500_original_public_business_email_dispatch_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/create or replace function public\.powerhouse_dispatch_relationship_public_research_v1\(/i);
 assert.match(sql,/v_pending=0 and not v_first_party_due/);
 assert.match(sql,/v_first_party_researched < 8/);
 assert.match(sql,/where missing\.email is null/);
 assert.match(sql,/from public\.bg_connecties known/);
 assert.match(sql,/join public\.bg_connecties missing/);
 assert.match(sql,/powerhouse_daily_scheduler_token/);
 assert.match(sql,/x-powerhouse-token/);
 assert.match(sql,/net\.http_post/);
 assert.match(sql,/grant execute on function public\.powerhouse_dispatch_relationship_public_research_v1\(date\)/i);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(|http[^\n]*apollo|GMAIL_SEND_EMAIL|HUNTER_EMAIL_FINDER|supabase\.functions\.deploy/i);
});

test('separate original #138 consumer verifies exact source, action and contact before candidate-only ONE BRAIN PROCESSED',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261114211500_original_public_business_email_dispatch_v1.sql',import.meta.url),'utf8');
 assert.match(sql,/create or replace function public\.powerhouse_ack_public_business_email_candidates_v1\(/i);
 assert.match(sql,/create or replace function public\.powerhouse_connection_daily_pulse_v1\(/i);
 assert.match(sql,/v_candidate_receipt:=public\.powerhouse_ack_public_business_email_candidates_v1\(25\)/);
 assert.match(sql,/r\.candidate->>'source_url' is distinct from r\.evidence->>'source_url'/);
 assert.match(sql,/r\.candidate->>'research_action_id' is distinct from r\.context->>'correlation_id'/);
 assert.match(sql,/a\.status='done'/);
 assert.match(sql,/brain_create_obligation\(/);
 assert.match(sql,/brain_transition_obligation\(/);
 assert.match(sql,/'state','PROCESSED'/);
 assert.match(sql,/'candidate_only',true/);
 assert.match(sql,/'verified_deliverability',false/);
 assert.match(sql,/'heartbeat_processed','NOT_PROVEN'/);
 assert.match(sql,/'sender_email_promotions',0/);
 assert.match(sql,/'external_messages_sent',0/);
 assert.doesNotMatch(sql,/cron\.schedule\s*\(|GMAIL_SEND_EMAIL|HUNTER_EMAIL_FINDER|APOLLO_PEOPLE_ENRICHMENT/i);
});


test('first-party Dutch about pages precede the old team/contact dead ends; same company https canonicalization only',()=>{
 assert.deepEqual(publicCompanyContactPaths('barnes.nl'),[
  'https://barnes.nl/over-ons/','https://barnes.nl/team/','https://barnes.nl/contact/'
 ]);
 assert.equal(samePublicCompanyRedirect('https://barnes.nl/over-ons/','https://www.barnes.nl/over-ons/','Barnes'),
   'https://www.barnes.nl/over-ons/');
 assert.equal(samePublicCompanyRedirect('https://barnes.nl/team/','/over-ons/','Barnes'),
   'https://barnes.nl/over-ons/');
 for(const url of ['http://barnes.nl/private','https://evil.example/contact',
   'https://127.0.0.1/','https://169.254.169.254/latest/meta-data','//evil.com/']){
   assert.equal(samePublicCompanyRedirect('https://barnes.nl/over-ons/',url,'Barnes'),null);
 }
 assert.deepEqual(publicCompanyContactPaths('127.0.0.1'),[]);
});
test('literal published visible work addresses on official Dutch staff cards are provenance-only, not guesses or send authority',()=>{
 const f={sourceUrl:'https://barnes.nl/over-ons/',personName:'Lieke Verheij',
  companyName:'Barnes',observedAt:at};
 const listing='<main><h1>Over Barnes</h1><h2>Ons team</h2><p>Cayro Blank Managing Partner cayro@barnes.nl</p><p>Lieke Verheij Managing Partner lieke@barnes.nl</p></main>';
 const evidence=publishedBusinessMailto({...f,html:listing});
 assert.equal(evidence?.email,'lieke@barnes.nl');
 assert.equal(evidence?.classification,'EXPLICIT_VISIBLE_PERSON_WORK_EMAIL');
 assert.equal(evidence?.deliverability,'UNVERIFIED');
 assert.equal(evidence?.send_authority,'NOT_INFERRED');
 assert.equal(evidence?.confidence,0.78);
 assert.equal(publishedBusinessMailto({...f,html:'<main>Barnes Lieke Verheij Managing Partner</main>'}),null);
 assert.equal(publishedBusinessMailto({...f,html:'<main>Barnes Lieke Verheij John Smith john@barnes.nl</main>'}),null,
   'never assign adjacent colleagues direct business addresses');
 assert.equal(publishedBusinessMailto({...f,html:'<main>Barnes Lieke Verheij lieke@gmail.com</main>'}),null);
 assert.equal(publishedBusinessMailto({...f,html:'<main>Barnes Lieke Verheij info@barnes.nl</main>'}),null);
 assert.equal(publishedBusinessMailto({...f,html:'<main>Barnes Lieke Verheij lieke@unrelated.com</main>'}),null);
 assert.equal(publishedBusinessMailto({...f,html:'<main>Barnes <script>Lieke Verheij lieke@barnes.nl</script></main>'}),null);
});
test('original provider source worker distinguishes unreadable HTML from an accessible page with no named listed address',()=>{
 const code=readFileSync(new URL('../supabase/functions/powerhouse-relationship-public-research/index.ts',import.meta.url),'utf8');
 assert.match(code,/publicCompanyContactPaths\(domain\)/);
 assert.match(code,/samePublicCompanyRedirect\(current,res\.headers\.get\('location'\),company\)/);
 assert.match(code,/redirect:'manual'/);
 assert.match(code,/SOURCE_REDIRECT_NOT_ALLOWED/);
 assert.match(code,/SOURCE_PAGE_UNAVAILABLE/);
 assert.match(code,/attempted\+\+/);
 assert.match(code,/SOURCE_HTML_READ/);
 assert.match(code,/public_work_email_candidates_staged/);
 assert.match(code,/new_provider_queries:0/);
 assert.doesNotMatch(code,/redirect:'follow'/);
 assert.doesNotMatch(code,/GMAIL_SEND_EMAIL|APOLLO_PEOPLE_ENRICHMENT|HUNTER_EMAIL_FINDER/);
});
