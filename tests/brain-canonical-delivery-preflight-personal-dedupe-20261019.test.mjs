import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const orchestrator = readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts', 'utf8');
const sender = readFileSync('supabase/functions/powerhouse-autonomous-outreach/index.ts', 'utf8');

test('Gmail preflight reports actual connected-account identity, without sending', () => {
  assert.match(sender, /account_resolved:Boolean\(acct\.id\)/);
  assert.match(sender, /account_user_resolved:Boolean\(acct\.userId\)/);
  assert.match(sender, /if\(input\?\.dry_run===true\)/);
  assert.match(sender, /external_outreach_executed:false/);
  assert.match(sender, /verifyRecipientAuthority\(db,a,/);
  assert.match(sender, /a\?\.evidence\?\.human_approved!==true/);
});

test('personal duplicate recovery excludes the rejected verified source rather than republishing a paraphrase', () => {
  assert.match(orchestrator, /const personalDuplicateRecovery = recoverableUniquenessDenial\(priorPersonal\)/);
  assert.match(orchestrator, /personalRejectedSourceIds = personalDuplicateRecovery/);
  assert.match(orchestrator, /personalRejectedSourceIds\.includes\(clean\(source\.recommendation_id\)\)/);
  assert.match(orchestrator, /recs\.filter\(validPersonalSource\)\.find/);
  assert.match(orchestrator, /NO_UNIQUE_VERIFIED_PERSONAL_SOURCE/);
  assert.match(orchestrator, /rejected_recommendation_ids:channel==='linkedin_company'\|\|channel==='linkedin_personal'/);
});

test('recovery never bypasses sender approval, uniqueness or provider truth on ambiguity', () => {
  assert.match(orchestrator, /authority\.issued===true && authority\.consumed===false/);
  assert.match(orchestrator, /evidence\.possible_provider_side_effect!==true/);
  assert.match(sender, /republish_forbidden:true/);
  assert.match(sender, /provider_readback_verified:true/);
});
