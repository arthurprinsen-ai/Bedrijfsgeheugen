import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {composerSourcePreflight} from '../supabase/functions/_shared/composer-quality-provenance.mjs';
import {assessHumanOutreachCopy} from '../supabase/functions/_shared/outreach-human-copy-guard.mjs';
const plan={play_key:'value_first',human_readable_context:false,source_trigger_relevance:false};
const base={channel_norm:'email',role:'CEO',company_name:'Test BV',evidence:{relationship_evidence:{linkedin_connection:{verified:true}}}};
const copy={subject:'Concrete ontwikkeling',message:'We zijn via LinkedIn verbonden. Ik ben Bedrijfsgeheugen begonnen. Interessant om te horen hoe jullie dit aanpakken.',personalization_anchor:'concrete ontwikkeling'};
test('identity-only reconnect is rejected before model generation with the same existing copy reason',()=>{
 assert.ok(assessHumanOutreachCopy(base,plan,copy).reasons.includes('LINKEDIN_RELATIONSHIP_ONLY_CONTEXT'));
 assert.equal(composerSourcePreflight(base,plan).ok,false);
 assert.ok(composerSourcePreflight(base,plan).missing.includes('substantive_outreach_evidence'));
});
test('identity-only first contact is held for all existing email aliases',()=>{
 for(const channel_norm of ['email','e-mail','reply_email']){
  const action={...base,channel_norm,evidence:{}};
  assert.equal(composerSourcePreflight(action,plan).ok,false);
  assert.ok(assessHumanOutreachCopy(action,plan,copy).reasons.includes('ROLE_ONLY_CONTEXT'));
 }
});
test('substantive existing research can recover same action without changing send authority',()=>{
 const a={...base,evidence:{...base.evidence,headline:'Publieke uitbreiding van de logistieke vestiging aangekondigd'}};
 assert.equal(composerSourcePreflight(a,plan).ok,true);
 assert.equal(assessHumanOutreachCopy(a,plan,copy).reasons.includes('LINKEDIN_RELATIONSHIP_ONLY_CONTEXT'),false);
});
test('non-email and original observed reply/followup retain prior scope',()=>{
 assert.equal(composerSourcePreflight({...base,channel_norm:'linkedin_dm'},plan).ok,true);
 assert.equal(composerSourcePreflight({...base,evidence:{inbound:{message:'Ik wil graag meer weten over jullie aanpak'}}},plan).ok,true);
 assert.equal(composerSourcePreflight(base,{...plan,play_key:'followup_new_angle'}).ok,true);
});
test('the same existing source gate runs before persuasion and model generation',()=>{
 const s=readFileSync('supabase/functions/powerhouse-commercial-message-composer/index.ts','utf8');
 const gate=s.indexOf('const sourceGate=composerSourcePreflight(workingAction,workingAction.message_plan)');
 assert.ok(gate>=0);
 assert.ok(s.indexOf('SOURCE_SPECIFIC_EVIDENCE_REQUIRED',gate)>gate);
 assert.ok(s.indexOf('const gen=await generate(',gate)>gate);
 assert.ok(s.indexOf('sourceVerifiedComposerHandoff(workingAction,research,news,now)')<gate);
 assert.ok(s.includes('hasDocumentedCommercialEmailAuthority(authority.extra)'));
});
