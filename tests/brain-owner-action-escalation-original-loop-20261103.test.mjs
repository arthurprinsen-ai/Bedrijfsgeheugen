import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planOwnerActionEscalations,OWNER_ACTION_ESCALATION_CONTRACT} from '../supabase/functions/_shared/owner-action-escalation.mjs';

const runDate='2026-11-03',now='2026-11-03T10:46:00.000Z';
const personal={channel:'linkedin_personal',code:'DISTINCT_VERIFIED_STORY_REQUIRED',status:'REQUIRES_RECOVERY',owner:'original personal publisher'};
const email={channel:'email_newsletter',code:'EMAIL_CANONICAL_AUTHORIZATION_REQUIRED',status:'REQUIRES_RECOVERY',requiresAuthorization:true,owner:'original email owner'};
const company={channel:'linkedin_company',code:'EXACT_PROVIDER_PUBLICATION_PROOF_MISSING',status:'REQUIRES_RECOVERY',requiresAuthorization:false,owner:'original LinkedIn owner'};
const base=(overdue=[personal,email,company])=>({
 runDate,now,recovery:{contract:'one-brain-publication-no-silent-gap-v1',status:'RECOVERY_DUE',overdue},
 decisions:[{channel:'linkedin_company',delivery_evidence:{provider_error:'LINKEDIN_COMPANY_FRESH_ORG_OAUTH_REQUIRED'},state:'content_ready'}],
 obligations:[{channel:'linkedin_company',status:'APPROVED',external_id:null},
 {channel:'linkedin_personal',status:'BLOCKED',external_id:null}]
});
test('only truly human required items prompt owner; duplicates remain original-agent work',()=>{
 const result=planOwnerActionEscalations(base());
 assert.equal(result.contract,OWNER_ACTION_ESCALATION_CONTRACT);
 assert.equal(result.status,'OWNER_ACTION_REQUIRED');
 assert.deepEqual(result.owner_action_due.map(x=>x.code),
 ['EMAIL_CANONICAL_AUTHORIZATION_REQUIRED','LINKEDIN_COMPANY_ADMIN_OAUTH_REQUIRED']);
 assert.equal(result.notification_sent,false);
 assert.equal(result.owner_action_due[0].notification_proof,'NOT_SENT_BY_CLASSIFIER');
 assert.equal(result.auto_fix_still_required,1);
});
test('fresh original OAuth confirmation suppresses stale 403 and reauth message',()=>{
 const input=base([company,personal]);
 input.linkedinPreflight={company_ready:true,company_oauth_fresh_verified:true};
 const result=planOwnerActionEscalations(input);
 assert.equal(result.status,'NO_OWNER_ACTION_REQUIRED');
 assert.deepEqual(result.owner_action_due,[]);
});
test('unverified provider accounts cannot be called authorized',()=>{
 const input=base([company]);
 input.linkedinPreflight={company_ready:false,company_oauth_fresh_verified:false};
 assert.equal(planOwnerActionEscalations(input).owner_action_due[0].code,'LINKEDIN_COMPANY_ADMIN_OAUTH_REQUIRED');
});
test('provider receipt prevents duplicate owner alert',()=>{
 const input=base([company]);
 input.obligations[0].external_id='urn:li:share:real-source-ack';
 assert.equal(planOwnerActionEscalations(input).owner_action_due.length,0);
});
test('only exact legitimate nonexpired Composio URL can be used as action',()=>{
 const input=base([company]);input.ownerLink={url:'https://connect.composio.dev/link/existing-owner',expires_at:'2026-11-03T11:06:00Z'};
 assert.equal(planOwnerActionEscalations(input).owner_action_due[0].action_url,input.ownerLink.url);
 input.ownerLink.expires_at='2026-11-03T10:44:00Z';
 assert.equal(planOwnerActionEscalations(input).owner_action_due[0].action_url,null);
 input.ownerLink.url='https://evil.example.com/reauth';
 input.ownerLink.expires_at='2026-11-03T11:06:00Z';
 assert.equal(planOwnerActionEscalations(input).owner_action_due[0].action_url,null);
});
test('no unsupported auto-green or phantom email receipt',()=>{
 assert.equal(planOwnerActionEscalations({runDate,now,recovery:{contract:'broken'}}).status,'UNVERIFIED');
 const original=readFileSync(new URL('../supabase/functions/powerhouse-content-loop/index.ts',import.meta.url),'utf8');
 assert.match(original,/import \{planOwnerActionEscalations\} from '\.\.\/_shared\/owner-action-escalation\.mjs'/);
 assert.match(original,/ownerActionEscalation=planOwnerActionEscalations\(/);
 assert.match(original,/ownerActionEscalation,\n\s+obligations:/);
 assert.match(original,/record_id: `content-closed-loop:\$\{runDate\}`/);
 assert.doesNotMatch(original,/ownerActionEscalation\.notification_sent\s*=\s*true/);
});
