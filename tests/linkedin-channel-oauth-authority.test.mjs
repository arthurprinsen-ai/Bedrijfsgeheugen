import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('supabase/functions/powerhouse-social-publisher/index.ts','utf8');

test('LinkedIn company uses organization-capability connection resolver', () => {
  assert.match(source, /async function composioLinkedInCompanyContext\(db:any\)/);
  const publishStart = source.indexOf('async function publishLinkedInCompanyViaComposio');
  const readStart = source.indexOf('async function readLinkedInCompanyPostViaComposio');
  assert.ok(publishStart >= 0);
  assert.ok(readStart >= 0);
  const publishBlock = source.slice(publishStart, readStart);
  assert.match(publishBlock, /composioLinkedInCompanyContext\(db\)/);
  assert.doesNotMatch(publishBlock, /composioLinkedInContext\(db\)/);

  const next = source.indexOf('\nfunction ', readStart);
  const readBlock = source.slice(readStart, next > readStart ? next : readStart + 3500);
  assert.match(readBlock, /composioLinkedInCompanyContext\(db\)/);
  assert.doesNotMatch(readBlock, /composioLinkedInContext\(db\)/);
});

test('company OAuth preflight is separate from personal OAuth preflight', () => {
  assert.match(source, /preflightLinkedInCompanyComposio/);
  assert.match(source, /row\.channel==='linkedin_company' \? await preflightLinkedInCompanyComposio\(db\) : await preflightLinkedInComposio\(db\)/);
  assert.match(source, /if\(row\.channel==='linkedin_company'\) await preflightLinkedInCompanyViaComposio\(db\); else await preflightLinkedInViaComposio\(db\);/);
});

test('company resolver proves exact organization capability before selection', () => {
  assert.match(source, /LINKEDIN_GET_COMPANY_INFO/);
  assert.match(source, /role:'ADMINISTRATOR'/);
  assert.match(source, /organization_capability_probe/);
  assert.match(source, /LINKEDIN_COMPANY_REAUTH_REQUIRED/);
});
