import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cfg = JSON.parse(fs.readFileSync(new URL('../config/powerhouse-data-sources.json', import.meta.url)));
const byId = new Map(cfg.sources.map((source) => [source.id, source]));

test('data intake spine is fail closed and forbids synthetic analytics', () => {
  assert.equal(cfg.version, 'powerhouse-data-intake-learning-spine-v1');
  assert.equal(cfg.rules.fail_closed, true);
  assert.equal(cfg.rules.production_readback_required, true);
  assert.equal(cfg.rules.synthetic_analytics_forbidden, true);
  assert.equal(cfg.rules.make_dependency_forbidden, true);
  assert.equal(cfg.rules.blocked_provider_is_not_healthy, true);
});

test('all canonical first-party and external source classes are registered', () => {
  for (const id of [
    'website-events', 'referral-campaign-attribution', 'buffer-social', 'content-performance',
    'google-analytics-4', 'google-search-console', 'technical-seo-web-performance',
    'external-signals', 'external-research-feeds', 'company-news', 'search-opportunities',
    'linkedin-relationship-intelligence', 'calendly', 'gmail-outbound-replies',
    'newsletter-campaign-analytics', 'pricing-positioning-learning', 'social-learning',
    'revenue-learning', 'forecast-calibration', 'growth-outcomes', 'sales-outcomes',
    'operational-failures'
  ]) assert.ok(byId.has(id), `missing source ${id}`);
});

test('scheduled critical feeds have explicit freshness and downstream lineage', () => {
  for (const id of ['buffer-social', 'google-analytics-4', 'google-search-console', 'external-signals', 'external-research-feeds']) {
    const source = byId.get(id);
    assert.equal(source.mode, 'scheduled');
    assert.ok(source.freshness_sla_hours > 0);
    assert.equal(source.required_activity, true);
    assert.ok(Array.isArray(source.downstream) && source.downstream.length > 0);
  }
});

test('provider lag is explicit for delayed Google datasets', () => {
  assert.equal(byId.get('google-analytics-4').provider_lag_hours, 24);
  assert.equal(byId.get('google-search-console').provider_lag_hours, 48);
});

test('event-driven commercial outcomes do not become false stale failures', () => {
  for (const id of ['growth-outcomes', 'sales-outcomes', 'pricing-positioning-learning', 'content-performance']) {
    assert.equal(byId.get(id).required_activity, false);
  }
});

test('gmail communication is live while newsletter campaign analytics stay fail-closed', () => {
  const gmail = byId.get('gmail-outbound-replies');
  assert.equal(gmail.provider, 'gmail');
  assert.equal(gmail.provider_layer, 'composio');
  assert.equal(gmail.mode, 'event-driven');
  assert.equal(gmail.status, 'live');
  assert.equal(gmail.required_activity, false);
  assert.ok(gmail.evidence.includes('sent_message_id'));
  assert.ok(gmail.evidence.includes('reply_observed'));
  assert.ok(gmail.downstream.includes('revenue-learning'));

  const newsletter = byId.get('newsletter-campaign-analytics');
  assert.equal(newsletter.mode, 'blocked');
  assert.equal(newsletter.status, 'blocked');
  assert.match(newsletter.blocker, /no dedicated newsletter campaign provider/i);
});

test('canonical provider ownership is explicit and does not introduce parallel providers', () => {
  assert.equal(byId.get('buffer-social').provider, 'buffer');
  assert.equal(byId.get('google-analytics-4').provider_layer, 'composio');
  assert.equal(byId.get('google-search-console').provider_layer, 'composio');
  assert.equal(JSON.stringify(cfg).toLowerCase().includes('windsor'), false);
});

test('external research feeds document the async two-phase schedule', () => {
  const source = byId.get('external-research-feeds');
  assert.match(source.schedule, /enqueue/);
  assert.match(source.schedule, /process/);
  assert.ok(source.providers.length >= 10);
});
