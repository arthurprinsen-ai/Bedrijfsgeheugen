import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=(path)=>fs.readFileSync(path,'utf8');

test('campaign must require real evidence for every personal send',()=>{
  for(const p of ['supabase/functions/powerhouse-autonomous-outreach/index.ts','supabase/functions/powerhouse-linkedin-sales-machine/index.ts']){
    const source=read(p);
    assert.ok(source.includes('source_specific_evidence_ok!==true'));
    assert.ok(source.includes('semantic_novelty_ok!==true'));
    assert.ok(source.includes('new_followup_evidence_ok!==true'));
  }
});

test('composer compares past send history and requires fresh follow-up facts',()=>{
  const source=read('supabase/functions/powerhouse-commercial-message-composer/index.ts');
  for(const rule of ['semanticNoveltyOk','newFollowupEvidenceOk','OUTREACH_HISTORY_UNAVAILABLE','sourceSpecificEvidenceOk'])assert.ok(source.includes(rule));
});

test('suppression affects new LinkedIn and email sales actions',()=>{
  const source=read('supabase/migrations/20261012074151_20261012093000_outreach_rejection_cross_channel_anti_repeat_4340.sql');
  for(const rule of ['powerhouse_email_contact_suppressions','linkedin_dm','new.status:=\'skipped\'','source_specific_evidence_ok','semantic_novelty_ok','new_followup_evidence_ok'])assert.ok(source.includes(rule));
});

test('Gmail response parser treats polite decline as a suppression',()=>{
  const source=read('supabase/functions/powerhouse-email-reply-loop/index.ts');
  for(const rule of ['vendor_fatigue_other_priorities','meerdere keren per dag benaderd','reply_followup',"if(c.next_action==='suppress')"])assert.ok(source.includes(rule));
});
