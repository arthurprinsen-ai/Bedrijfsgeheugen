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
  const personalCreate = source.indexOf('publishLinkedInPersonalViaComposio(db,art)');
  const companyCreate = source.indexOf('publishLinkedInCompanyViaComposio(db,art)');
  const instagramCreate = source.indexOf('publishInstagramViaComposio(db, art, runDate)');
  assert.ok(uniqueness > 0);
  assert.ok(personalCreate > uniqueness);
  assert.ok(companyCreate > uniqueness);
  assert.ok(instagramCreate > uniqueness);
});

test('personal LinkedIn story fingerprint and keyword-level duplicate protection are mandatory', () => {
  assert.match(source, /publicationStoryFingerprint/);
  assert.match(source, /personal-story-v1:/);
  assert.match(source, /p_story_fingerprint:storyFingerprint/);
  assert.match(source, /powerhouse-global-post-story-uniqueness-v2/);
});

test('story fingerprint normalization has one database authority', () => {
  assert.match(source, /db\.rpc\('powerhouse_story_fingerprint_v1',\{p_source:source\}\)/);
  assert.match(source, /STORY_FINGERPRINT_RPC/);
  assert.match(source, /publicationStoryFingerprint\(db,row,art\)/);
  assert.doesNotMatch(source, /digest\('personal-story-v1:'\+source\.toLowerCase/);
});
