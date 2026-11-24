import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {assessHumanOutreachCopy,inferObservedOutreachIntent,hasSubstantiveOutreachEvidence}
  from '../supabase/functions/_shared/outreach-human-copy-guard.mjs';
import {buildEditorialCouncilBrief} from '../supabase/functions/_shared/editorial-council-context.mjs';

const roleOnly={role:'Executive Research Consultant',company_name:'Boardtrust.',evidence:{relationship_evidence:{role:'Executive Research Consultant',company_name:'Boardtrust.'}}};
const draft={
 subject:'Korte observatie voor Executive Research Consultant (Boardtrust.)',
 message:'Beste Manuela,\nAls Executive Research Consultant bij Boardtrust vraag ik me iets voor: mogelijk blijven onderzoeksinzichten los van besluiten (probleem). Oorzaak zou kunnen zijn dat onderzoeken geen eigenaar krijgen. Praktische les: gebruik een beslissingskaart. Beperking: dit is een verkennende hypothese, geen gemeten uitkomst. Alternatief is niets doen.\nMag ik twee concrete observaties sturen?',
 personalization_anchor:'Executive Research Consultant'
};

test('sent Manuela copy is rejected despite existing 1.0 composer score',()=>{
  const result=assessHumanOutreachCopy(roleOnly,{play_key:'first_touch'},draft);
  assert.equal(result.passed,false);
  for(const name of ['ROLE_ONLY_CONTEXT','ROLE_ONLY_PERSONALIZATION_ANCHOR','PARENTHETICAL_EDITORIAL_LABEL','GENERIC_SUBJECT','EMPTY_TWO_OBSERVATIONS_CTA','FAKE_ALTERNATIVE'])assert.ok(result.reasons.includes(name),name);
});
test('internal agent and fake certainty disclaimers cannot leak to a recipient',()=>{
  const action={...roleOnly,evidence:{headline:'Een controleerbaar nieuwsfeit over aankomende sectorverandering'}};
  const output={subject:'Een vraag over jullie onderzoek',message:'Beperking: dit is een verkennende hypothese.\nHuman Commercial Composer — Bedrijfsgeheugen',personalization_anchor:'sectorverandering'};
  const result=assessHumanOutreachCopy(action,{},output);
  assert.equal(result.passed,false);
  assert.ok(result.reasons.includes('ROBOT_SIGNATURE'));
  assert.ok(result.reasons.includes('INTERNAL_EDITORIAL_LABEL'));
});
test('verified public hook with natural Dutch passes the copy guard',()=>{
  const action={...roleOnly,evidence:{public_source_evidence:{evidence:{headline:'Boardtrust heeft een nieuwe publicatie over onderzoek naar bestuursopvolging uitgebracht'}}}};
  const output={subject:'Vraag over jullie publicatie',message:'Hoi Manuela, ik las jullie publicatie over bestuursopvolging. Interessant hoe een onderzoeksresultaat pas waarde krijgt als mensen er echt mee aan de slag kunnen. Ik werk aan de verbinding tussen inzichten en praktische uitvoering. Speelt dat bij jullie ook?',personalization_anchor:'publicatie over onderzoek naar bestuursopvolging'};
  assert.equal(hasSubstantiveOutreachEvidence(action),true);
  assert.deepEqual(assessHumanOutreachCopy(action,{play_key:'first_touch'},output).reasons,[]);
});
test('reply and follow-up intent come from real interaction or play, not guessed buying score',()=>{
  assert.equal(inferObservedOutreachIntent({...roleOnly,evidence:{inbound:{message:'Kun je een voorbeeld laten zien?'}}},{}),'REPLY_TO_CONTACT');
  assert.equal(inferObservedOutreachIntent(roleOnly,{play_key:'followup_new_angle'}),'FOLLOWUP_WITH_NEW_FACT');
  assert.equal(inferObservedOutreachIntent(roleOnly,{}),'FIRST_CONTACT');
});
test('email editorial instruction is different from blog / company LinkedIn checklist',()=>{
  const email=buildEditorialCouncilBrief({channel:'email_outreach'});
  const company=buildEditorialCouncilBrief({channel:'linkedin_company'});
  assert.match(email.instruction,/contactintentie/);
  assert.doesNotMatch(email.instruction,/een eerlijk alternatief \(ook niets doen\)/);
  assert.match(company.instruction,/een eerlijk alternatief \(ook niets doen\)/);
});
test('original sender and quality gates remain intact',()=>{
  const composer=fs.readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');
  const sender=fs.readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8');
  for(const key of ['assessHumanOutreachCopy','sourceSpecificEvidenceOk','semanticNoveltyOk','newFollowupEvidenceOk','powerhouse_message_quality_v1'])assert.ok(composer.includes(key),key);
  for(const key of ['verifyRecipientAuthority','providerUncertaintyNoResend','provider_readback_verified:true'])assert.ok(sender.includes(key),key);
});

// LAST_MILE_HUMAN_COPY_CHECK_REGRESSION: existing prepared drafts must not bypass the gate.
test('original Gmail sender rechecks natural copy before provider claim and send',()=>{
  const sender=fs.readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8');
  const lastMile=sender.indexOf('const humanCopy=assessHumanOutreachCopy(');
  const claim=sender.indexOf('const sendIntent=');
  assert.ok(lastMile>0&&claim>lastMile,'copy gate precedes durable provider claim');
  assert.match(sender,/HUMAN_OUTREACH_COPY_REJECTED/);
  assert.match(sender,/rejection_codes:humanCopy.reasons/);
  assert.match(sender,/role,source_url,message_draft,evidence/);
});

import {renderBrandedOutreachHtml,renderBrandedOutreachPlainText,BEDRIJFSGEHEUGEN_LOGO,BEDRIJFSGEHEUGEN_SITE}
  from '../supabase/functions/_shared/brand-outreach-signature.mjs';

test('verified LinkedIn network reconnection states the real tie and founder introduction',()=>{
  const contact={...roleOnly,evidence:{relationship_evidence:{
    linkedin_connection:{verified:true,connected_on:'28 Sep 2016',source:'canonical_bg_connecties_linkedin_export'},
    confirmed_event:'Boardtrust begeleidt familiebedrijven bij leiderschaps- en opvolgingsvraagstukken'
  }}};
  const good={
    subject:'Onze LinkedIn-connectie en een vraag',
    personalization_anchor:'LinkedIn',
    message:'Hoi Manuela,\n\nWe zijn via LinkedIn verbonden. Ik ben Bedrijfsgeheugen begonnen omdat ik bedrijven wil helpen kennis, beslissingen en acties beter met elkaar te verbinden. Bij leiderschapswisselingen lijkt het me interessant hoe die kennis in een organisatie blijft. Speelt dat onderwerp bij jullie ook?'
  };
  assert.equal(inferObservedOutreachIntent(contact,{}),'LINKEDIN_CONNECTION_RECONNECT');
  assert.equal(assessHumanOutreachCopy(contact,{},good).passed,true);
  assert.equal(assessHumanOutreachCopy(contact,{},{
    ...good,message:good.message.replace('We zijn via LinkedIn verbonden. ','')
  }).reasons.includes('LINKEDIN_CONNECTION_NOT_ACKNOWLEDGED'),true);
  assert.equal(assessHumanOutreachCopy(contact,{},{
    ...good,message:good.message.replace('Ik ben Bedrijfsgeheugen begonnen','Ik denk')
  }).reasons.includes('FOUNDER_INTRODUCTION_MISSING'),true);
  assert.equal(assessHumanOutreachCopy(roleOnly,{},good).passed,false);
});
test('HTML signature has official logo, website and visible text without tracking',()=>{
  const html=renderBrandedOutreachHtml('Hoi Manuela,\n\nWe zijn via LinkedIn verbonden.');
  const plain=renderBrandedOutreachPlainText('Hoi Manuela');
  assert.match(html,/<img src="https:\/\/www\.bedrijfsgeheugen\.nl\/assets\/merk\/logo-merk\.png"/);
  // Review closure: parse each complete href rather than trusting a URL substring.
  const hrefs=[...html.matchAll(/\shref="([^"]+)"/g)].map(match=>match[1]);
  const httpsHrefs=hrefs.filter(href=>new URL(href).protocol==='https:');
  assert.deepEqual(httpsHrefs,[BEDRIJFSGEHEUGEN_SITE,BEDRIJFSGEHEUGEN_SITE]);
  for(const href of httpsHrefs){
    const parsed=new URL(href);
    assert.equal(parsed.hostname,'www.bedrijfsgeheugen.nl');
    assert.equal(parsed.pathname,'/');
    assert.equal(parsed.username,'');
    assert.equal(parsed.password,'');
  }
  assert.match(html,/<strong>Bedrijfsgeheugen<\/strong>/);
  assert.match(html,/Arthur Prinsen/);
  assert.match(html,/afmelden/);
  assert.ok(!/pixel|utm_|tracking|redirector/i.test(html));
  const plainUrlLines=plain.split(/\r?\n/).map(line=>line.trim());
  assert.ok(plainUrlLines.some(line=>{
    try{return new URL(line).href===BEDRIJFSGEHEUGEN_SITE;}catch{return false;}
  }),'text signature contains exactly the allowed canonical complete site URL');
  assert.ok(plain.includes('Bedrijfsgeheugen'));
  assert.equal(BEDRIJFSGEHEUGEN_SITE,'https://www.bedrijfsgeheugen.nl/');
  assert.equal(BEDRIJFSGEHEUGEN_LOGO,'https://www.bedrijfsgeheugen.nl/assets/merk/logo-merk.png');
});
test('original Gmail sender sends HTML with strict independent copy and recipient gates',()=>{
  const sender=fs.readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8');
  const composer=fs.readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');
  assert.match(sender,/is_html:true/);
  assert.match(sender,/renderBrandedOutreachHtml\(body/);
  assert.match(sender,/send\(key,acct,to,sub,withOptOutLine\(body\)\)/);
  assert.match(sender,/assessHumanOutreachCopy\(a,\{\},/);
  assert.match(sender,/composer\?\.natural_copy_ok!==true/);
  assert.match(sender,/verifyRecipientAuthority/);
  assert.match(sender,/CONTACT_SUPPRESSED/);
  assert.match(sender,/RECIPIENT_CONTACT_PRESSURE_14D/);
  assert.match(sender,/providerUncertaintyNoResend/);
  assert.match(composer,/LINKEDIN_CONNECTION_EVIDENCE_READ/);
  assert.match(composer,/canonical_bg_connecties_linkedin_export/);
  assert.match(composer,/natural_copy_ok:qv\.checks\.natural_copy_ok/);
});

test('first-degree connection comes from matching CRM identity, not action source URL',()=>{
  const composer=fs.readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');
  assert.match(composer,/matching_basis:'person_key_and_recipient_email'/);
  assert.match(composer,/\.eq\('sleutel',personKey\)\.eq\('email',recipientEmail\)/);
  assert.match(composer,/connection\?\.bron==='linkedin-export'/);
  assert.match(composer,/connectedOn&&/);
  assert.ok(!composer.includes("/^https:\\/\\/www\\.linkedin\\.com\\/in\\//i.test(clean(workingAction.source_url))"),'no action source URL-only connection requirement');
});


import {hasDocumentedCommercialEmailAuthority,classifyFounderOutreachSegment}
  from '../supabase/functions/_shared/outreach-human-copy-guard.mjs';

test('LinkedIn first-degree membership alone is not specific recipient topic evidence',()=>{
  const contact={...roleOnly,evidence:{relationship_evidence:{
    linkedin_connection:{verified:true,connected_on:'28 Sep 2016'}
  }}};
  const message={
    subject:'Kennis en besluiten',
    message:'Hoi Manuela, we zijn via LinkedIn verbonden. Ik ben Bedrijfsgeheugen begonnen omdat kennis belangrijk is. Mag ik je iets sturen?'
  };
  const judged=assessHumanOutreachCopy(contact,{},message);
  assert.equal(judged.passed,false);
  assert.ok(judged.reasons.includes('LINKEDIN_RELATIONSHIP_ONLY_CONTEXT'));
});

test('first founder outreach avoids meeting pressure and multiple unrelated questions',()=>{
  const contact={...roleOnly,evidence:{headline:'Gepubliceerde aankondiging van een nieuwe dienstverlening voor opvolging'}};
  const msg={subject:'Vraag over opvolging',
    message:'Hoi Manuela, ik zag de aangekondigde dienstverlening. Zullen we volgende week een afspraak inplannen? Heb je dinsdag tijd?'};
  const judged=assessHumanOutreachCopy(contact,{},msg);
  assert.equal(judged.passed,false);
  assert.ok(judged.reasons.includes('PUSHY_MEETING_CTA_FIRST_TOUCH'));
  assert.ok(judged.reasons.includes('MULTIPLE_UNRELATED_QUESTIONS'));
});

test('founder segmentation is a role-only hypothesis, never permission or invented buyer pain',()=>{
  assert.equal(classifyFounderOutreachSegment({role:'CFO'}),'FINANCE');
  assert.equal(classifyFounderOutreachSegment({role:'Lead Data Engineer'}),'DATA_IT_INNOVATION');
  assert.equal(classifyFounderOutreachSegment({role:'HR manager'}),'HR_OPERATIONS');
  assert.equal(classifyFounderOutreachSegment({role:'CEO en oprichter'}),'FOUNDER_LEADERSHIP');
  assert.equal(classifyFounderOutreachSegment({role:''}),'GENERAL_UNVERIFIED');
  const composer=fs.readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');
  assert.match(composer,/founder_audience_hypothesis:classifyFounderOutreachSegment/);
});

test('commercial email requires documented permission separately from LinkedIn and internal human approval',()=>{
  const internalOnly={human_approved:true,approval:{basis:'bestaande relatie resp. zakelijk adres'}};
  assert.equal(hasDocumentedCommercialEmailAuthority(internalOnly),false);
  assert.equal(hasDocumentedCommercialEmailAuthority({linkedin_connection:{verified:true}}),false);
  const consent={basis:'explicit_opt_in',granted:true,purpose:'commercial_email',
    granted_at:'2026-11-20T09:00:00Z',evidence_ref:'crm:consent:independent-audit-123'};
  assert.equal(hasDocumentedCommercialEmailAuthority({email_marketing_permission:consent}),true);
  assert.equal(hasDocumentedCommercialEmailAuthority({email_marketing_permission:{...consent,granted:false}}),false);
  assert.equal(hasDocumentedCommercialEmailAuthority({email_marketing_permission:consent,approval_revoked:true}),false);
  assert.equal(hasDocumentedCommercialEmailAuthority({email_marketing_permission:consent,approval_revoked:{on:'2026-10-27',reason:'outside permitted audience'}}),false);
  assert.equal(hasDocumentedCommercialEmailAuthority({email_marketing_permission:{...consent,revoked:true}}),false);
  const customer={basis:'existing_customer_soft_opt_in',recorded_at:'2026-11-18',
    evidence_ref:'invoice:verified:2026-180',transaction_ref:'INV-2026-180',
    existing_customer_verified:true,similar_products_or_services:true,
    opt_out_offered_at_collection:true,opt_out_available_now:true};
  assert.equal(hasDocumentedCommercialEmailAuthority({email_marketing_permission:customer}),true);
  assert.equal(hasDocumentedCommercialEmailAuthority({email_marketing_permission:{...customer,opt_out_offered_at_collection:false}}),false);
  const sender=fs.readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts','utf8');
  assert.match(sender,/c\?\.extra\?\.human_approved===true&&hasDocumentedCommercialEmailAuthority\(c\.extra\)/);
});
