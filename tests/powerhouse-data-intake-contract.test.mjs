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
});

test('required first-party and external source classes are registered', () => {
  for (const id of [
    'website-events', 'buffer-social', 'google-analytics-4', 'google-search-console',
    'external-signals', 'company-news', 'search-opportunities',
    'linkedin-relationship-intelligence', 'calendly', 'social-learning',
    'revenue-learning', 'forecast-calibration', 'growth-outcomes', 'sales-outcomes',
    'operational-failures'
  ]) assert.ok(byId.has(id), `missing source ${id}`);
});

test('scheduled critical feeds have explicit freshness and downstream lineage', () => {
  for (const id of ['buffer-social', 'google-analytics-4', 'google-search-console', 'external-signals']) {
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
  for (const id of ['growth-outcomes', 'sales-outcomes']) {
    assert.equal(byId.get(id).mode, 'event-driven');
    assert.equal(byId.get(id).required_activity, false);
  }
});
