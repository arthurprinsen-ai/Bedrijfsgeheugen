import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const growth = JSON.parse(readFileSync('config/seo-growth-loop.json','utf8'));
const policy = growth.optimization.daily_search_and_ai_traffic_growth;
const skill = readFileSync('.agents/skills/powerhouse-seo-conversion-orders/SKILL.md','utf8');
const agents = readFileSync('platform/agents/agent-team.mjs','utf8');

test('daily Google/ChatGPT/Claude growth uses only the original SEO owner and 3 reversible changes', () => {
  assert.equal(policy.fingerprint,'seo|daily-google-chatgpt-claude-qualified-traffic|20261112-v1');
  assert.equal(policy.original_automation_id,'6ad5b66790548191ad87ca89c4fd00ab');
  assert.equal(policy.no_parallel_scheduler,true);
  assert.equal(policy.same_original_writer,true);
  assert.equal(policy.max_changes_per_day,3);
  assert.equal(policy.claim_live_only_on_exact_provider_readback,true);
  assert.deepEqual(policy.acquisition_channels,['google_organic','chatgpt_referral','claude_referral']);
  assert.match(policy.objective,/daily action not guaranteed daily positive search volume/);
  assert.match(policy.daily_loop.join(','),/ONE_BRAIN_owner_ACK_Heartbeat_Portal/);
});

test('first observed baseline cannot be misreported as real human users or confirmed AI clicks', () => {
  const b=policy.baseline_observed_2026_11_12;
  assert.equal(b.non_robot_events,316);
  assert.equal(b.non_robot_page_view_events,125);
  assert.equal(b.pageviews_with_observed_referrer_field,0);
  assert.equal(b.keyword_intelligence_records,15);
  assert.equal(b.ga4_latest_sync_measurements_written,0);
  assert.equal(b.chatgpt_human_referrals,'NOT_MEASURED');
  assert.equal(b.claude_human_referrals,'NOT_MEASURED');
  const invariants=new Set(policy.measurement_invariants);
  for(const x of ['events_are_not_unique_visitors','a_zero_update_success_must_not_count_as_fresh_metric_delivery','ChatGPT_and_Claude_citations_are_not_human_visits','missing_referrer_or_GSC_or_provider_results_means_UNKNOWN_not_zero']) assert.ok(invariants.has(x),'missing '+x);
  assert.match(policy.diagnostic_guardrails.ga4_zero_update,/independent readback/);
});

test('original agent team and SEO skill inherit the same fail-closed acquisition rule', () => {
  for(const x of ['verify-consented-google-and-ai-human-referrals','reconcile-stale-keyword-and-ga4-zero-update-source-with-original-owner','reject-ga4-ok-with-zero-measurement-write-as-success','recover-original-seo-keyword-freshness-with-same-owner-ack']) assert.ok(agents.includes(x),'missing '+x);
  assert.match(skill,/dagelijkse aantoonbare bezoekersgroei uit Google, ChatGPT en Claude/);
  assert.match(skill,/SOURCE_OR_ATTRIBUTION_DEGRADED/);
  assert.match(skill,/ONE BRAIN → Powerhouse → Heartbeat → Portal/);
  assert.match(skill,/Geen extra cron|Geen extra scheduler|geen extra cron/i);
});
