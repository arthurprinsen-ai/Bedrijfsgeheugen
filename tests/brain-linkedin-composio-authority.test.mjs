import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('supabase/functions/powerhouse-social-publisher/index.ts', 'utf8');

test('LinkedIn publishing authority is Composio-only before Buffer fallback', () => {
  assert.match(source, /publishLinkedInPersonalViaComposio/);
  assert.match(source, /publishLinkedInCompanyViaComposio/);
  assert.match(source, /transport_contract:'linkedin-composio-direct-v2'/);
  assert.doesNotMatch(source, /row\.channel === 'linkedin_company' && bufferCircuit\.active/);
  assert.doesNotMatch(source, /await markLinkedInRateLimited\(db,runDate,bufferCircuit\)/);

  const companyPublish = source.indexOf("if (row.channel === 'linkedin_company') {", source.indexOf("publishLinkedInPersonalViaComposio"));
  const genericBuffer = source.indexOf("if (!bufferToken)");
  assert.ok(companyPublish >= 0, 'LinkedIn company Composio branch missing');
  assert.ok(genericBuffer > companyPublish, 'LinkedIn company must terminate before generic Buffer fallback');
});

test('LinkedIn company fails closed unless exact Composio readback is proven', () => {
  assert.match(source, /COMPOSIO_LINKEDIN_COMPANY_EXACT_READBACK_MISMATCH/);
  assert.match(source, /COMPOSIO_LINKEDIN_COMPANY_AUTHOR_UNVERIFIED/);
  assert.match(source, /COMPOSIO_LINKEDIN_COMPANY_AUTHOR_AMBIGUOUS/);
  assert.match(source, /republish_forbidden:true/);
  assert.match(source, /do not fall back to Buffer or issue a replacement post/);
});

test('Composio execution uses v3.1 latest tool semantics', () => {
  assert.match(source,/https:\/\/backend\.composio\.dev\/api\/v3\.1/);
  assert.match(source,/version:'latest'/);
  assert.doesNotMatch(source,/backend\.composio\.dev\/api\/v3'/);
});

test('LinkedIn personal preserves created URN when exact readback is unavailable', () => {
  assert.match(source, /provider_create_success:true/);
  assert.match(source, /verification_pending:true/);
  assert.match(source, /readback_error:error instanceof Error\?error\.message:String\(error\)/);
  assert.match(source, /LINKEDIN_PERSONAL_READBACK_PENDING/);
  assert.match(source, /Reconcile this exact LinkedIn personal post URN; never issue another post for this daily claim/);
  assert.match(source, /state:verified\?'published':'dispatching'/);
  assert.match(source, /republish_forbidden:true/);
});

test('all social provider side effects require global historical uniqueness reservation', () => {
  assert.match(source, /powerhouse_reserve_unique_publication_v1/);
  assert.match(source, /p_similarity_threshold:0\.62/);
  assert.match(source, /GLOBAL_POST_DUPLICATE_BLOCKED/);
  assert.match(source, /global_uniqueness_gate:'blocked'/);
  assert.match(source, /republish_forbidden:true/);
  const uniqueness = source.indexOf('reserveGlobalUniquePublication(db,runDate,row.channel,clean(art.body),storyFingerprint)');
  const personalCreate = source.indexOf('publishLinkedInPersonalViaComposio(db,art)', uniqueness);
  const companyCreate = source.indexOf('publishLinkedInCompanyViaComposio(db,art)', uniqueness);
  const instagramCreate = source.indexOf('publishInstagramViaComposio(db,art,runDate,instagramContext)', uniqueness);
  assert.ok(uniqueness > 0);
  assert.ok(personalCreate > uniqueness);
  assert.ok(companyCreate > uniqueness);
  assert.ok(instagramCreate > uniqueness);
});

test('personal LinkedIn story fingerprint and keyword-level duplicate protection are mandatory', () => {
  assert.match(source, /publicationStoryFingerprint/);
  assert.match(source, /p_story_fingerprint:storyFingerprint/);
  assert.match(source, /powerhouse-global-post-story-uniqueness-v2/);
});

test('story fingerprint normalization has one database authority', () => {
  assert.match(source, /db\.rpc\('powerhouse_story_fingerprint_v1',\{p_source:source\}\)/);
  assert.match(source, /STORY_FINGERPRINT_RPC/);
  assert.match(source, /publicationStoryFingerprint\(db,row,art\)/);
  assert.doesNotMatch(source, /digest\('personal-story-v1:'\+source\.toLowerCase/);
});


test('LinkedIn company resolves a live organization-capable connection separately from personal', () => {
  assert.match(source, /async function composioLinkedInCompanyContext\(db:any\)/);
  const publishStart = source.indexOf('async function publishLinkedInCompanyViaComposio');
  const readStart = source.indexOf('async function readLinkedInCompanyPostViaComposio');
  assert.ok(publishStart >= 0);
  assert.ok(readStart > publishStart);
  const publishBlock = source.slice(publishStart, readStart);
  assert.match(publishBlock, /composioLinkedInCompanyContext\(db\)/);
  assert.doesNotMatch(publishBlock, /composioLinkedInContext\(db\)/);
  const nextFunction = source.indexOf('\nfunction ', readStart);
  const readBlock = source.slice(readStart, nextFunction > readStart ? nextFunction : readStart + 3500);
  assert.match(readBlock, /composioLinkedInCompanyContext\(db\)/);
  assert.doesNotMatch(readBlock, /composioLinkedInContext\(db\)/);
});

test('LinkedIn company preflight proves live organization ACL on the exact token', () => {
  assert.match(source, /preflightLinkedInCompanyComposio/);
  assert.match(source, /preflightLinkedInCompanyViaComposio/);
  assert.match(source, /LINKEDIN_GET_COMPANY_INFO/);
  assert.match(source, /role:'ADMINISTRATOR'/);
  assert.match(source, /organization_capability_probe/);
  assert.match(source, /LINKEDIN_COMPANY_REAUTH_REQUIRED/);
  assert.match(source, /row\.channel==='linkedin_company' \? await preflightLinkedInCompanyComposio\(db\) : await preflightLinkedInComposio\(db\)/);
});


test('LinkedIn reconciliation remains active while Buffer circuit is open', () => {
  assert.match(source, /async function reconcileExistingProviderTruth\(db: any, token: string \| null, runDate: string\)/);
  assert.match(source, /provider_reconciliation = await reconcileExistingProviderTruth\(/);
  assert.match(source, /!bufferCircuit\.active && bufferToken \? bufferToken : null/);
  assert.match(source, /reason:'BUFFER_AUDIT_DEFERRED'/);
  const reconciliation = source.indexOf('provider_reconciliation = await reconcileExistingProviderTruth(');
  const containment = source.indexOf('containment_sweep = await containmentSweepInstagram', reconciliation);
  assert.ok(reconciliation > 0);
  assert.ok(containment > reconciliation);
});


test('LinkedIn company provider create acknowledgement closes publication even when exact readback is permission-limited', () => {
  assert.match(source, /provider_publication_ack_verified:true/);
  assert.match(source, /providerCreateProven=direct\.provider_create_success===true/);
  assert.match(source, /state:'published'/);
  assert.match(source, /recordObligation\(db,runDate,row\.channel,'PUBLISHED',direct\.provider_post_id/);
  assert.match(source, /readback_permission_limited/);
  assert.match(source, /exact API readback is optional after provider create acknowledgement and must never trigger republish/);
});

test('LinkedIn company reconciliation never converts a provider-created URN into a false publication failure', () => {
  assert.match(source, /const providerCreateProven=previous\?\.provider_create_success===true/);
  assert.match(source, /Provider create acknowledgement is authoritative for side-effect existence/);
  assert.match(source, /republish_forbidden:true/);
  assert.match(source, /readback is permission-limited/);
});
