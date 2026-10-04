import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const migration = fs.readFileSync('supabase/migrations/20261004133000_linkedin_company_growth_engine_v1.sql','utf8');
const policy = JSON.parse(fs.readFileSync('config/linkedin-company-growth-v1.json','utf8'));
const skill = fs.readFileSync('.agents/skills/powerhouse-linkedin-company-growth/SKILL.md','utf8');
const learning = JSON.parse(fs.readFileSync('brain/learning/2026-10-04-linkedin-company-page-growth-v1.json','utf8'));

test('canonical organization and baseline are explicit', () => {
  assert.equal(policy.canonicalOrganizationUrn, 'urn:li:organization:18234216');
  assert.equal(policy.baseline.pageViews, 12);
  assert.equal(policy.baseline.desktopPageViews, 10);
  assert.equal(policy.baseline.mobilePageViews, 2);
  assert.match(migration, /urn:li:organization:18234216/);
  assert.match(migration, /date '2026-10-04','user_admin_screenshot',12,10,2/);
});

test('targets and bounded daily behavior are aligned', () => {
  assert.equal(policy.targets.pageViews30d, 300);
  assert.equal(policy.targets.relevantNewFollowers30d, 100);
  assert.equal(policy.limits.maxCompanyPostsPerDay, 1);
  assert.equal(policy.limits.maxGrowthRecommendationsPerDay, 3);
  assert.match(migration, /'canonical','urn:li:organization:18234216',300,100,1,3,true/);
  assert.match(migration, /value_asset_distribution/);
  assert.match(migration, /company_page_distribution_loop/);
  assert.match(migration, /company_page_conversion_optimization/);
});

test('existing commercial scheduler is reused and no new cron is introduced', () => {
  assert.match(migration, /powerhouse_trigger_based_mkb_acquisition_cycle_v1/);
  assert.match(migration, /powerhouse_refresh_linkedin_company_growth_v1\(p_run_date\)/);
  assert.doesNotMatch(migration, /cron\.schedule|create\s+extension\s+.*pg_cron/i);
  assert.equal(policy.rules.reuseExistingCommercialScheduler, true);
  assert.equal(policy.rules.createParallelScheduler, false);
});

test('personal LinkedIn identity boundary remains hard', () => {
  assert.equal(policy.rules.personalLinkedInCommercialBridgeForbidden, true);
  assert.match(skill, /persoonlijke LinkedIn-profiel niet als commerciële traffic-bridge/i);
  assert.doesNotMatch(migration, /target_channel\s*[,)]?\s*['"]linkedin_personal['"]/i);
});

test('vanity metrics remain intermediate and revenue stays north star', () => {
  assert.deepEqual(policy.northStar, ['paid_order','realized_revenue']);
  assert.match(migration, /Page views and followers are intermediary distribution signals, not revenue or buying intent/);
  assert.equal(learning.change.targets.pageViews30d, 300);
});
