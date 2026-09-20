import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('supabase/functions/bg-pre-publish-review/index.ts','utf8');

test('generic business rules apply only to linkedin company',()=>{
  assert.match(source,/if \(channel === 'linkedin_company'\) \{/);
  assert.match(source,/generic_rule_check_applied: channel === 'linkedin_company'/);
  assert.doesNotMatch(source,/if \(channel !== 'linkedin_personal'\) \{/);
});

test('instagram keeps dedicated Mira proof gates',()=>{
  assert.match(source,/channel === 'instagram_company'/);
  assert.match(source,/instagramProofViolations\(body\)/);
  assert.match(source,/MIRA_GATE_NOT_PROVEN/);
});
