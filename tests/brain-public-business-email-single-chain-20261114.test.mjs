import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {eligiblePublicCompanyPage,publishedBusinessMailto} from '../supabase/functions/_shared/public-business-email-evidence.mjs';

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
