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
