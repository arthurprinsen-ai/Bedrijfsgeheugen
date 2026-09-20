import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source=readFileSync('supabase/functions/powerhouse-content-orchestrator/index.ts','utf8');

test('company recommendation selection excludes personal truth and personal target',()=>{
  assert.match(source,/channel === 'linkedin_company'[\s\S]*target === 'linkedin_personal'/);
  assert.match(source,/evidence\?\.identity_contract === PERSONAL_CONTRACT/);
  assert.match(source,/evidence\?\.personal_truth_verified === true/);
});

test('company publication generation creates a measurable canonical campaign link',()=>{
  assert.match(source,/li-company-\$\{runDate\.replaceAll\('-', ''\)\}/);
  assert.match(source,/https:\/\/www\.bedrijfsgeheugen\.nl\/g\/\$\{key\}/);
  assert.match(source,/bg_campaign_links/);
  assert.match(source,/COMPANY_TRACKING_LINK_WRITE_FAILED/);
});

test('personal final copy is fail-closed on concrete first-person truth',()=>{
  assert.match(source,/function personalFinalCopyValid/);
  assert.match(source,/PERSONAL_FINAL_COPY_TRUTH_INVARIANT_FAILED/);
  assert.match(source,/De uiteindelijke tekst MOET expliciet in de ik-vorm/);
});
