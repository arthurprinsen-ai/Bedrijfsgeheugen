import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const cfg = JSON.parse(fs.readFileSync('config/visitor-growth-target.json', 'utf8'));
const loop = JSON.parse(fs.readFileSync('config/seo-growth-loop.json', 'utf8'));

test('visitor growth target keeps honest baseline and unmeasured is UNKNOWN', () => {
  assert.equal(cfg.daily_metric.unmeasured_is, 'UNKNOWN');
  assert.equal(cfg.baseline.search_console_clicks_28d, 1);
  assert.ok(cfg.levers_in_order[0].includes('Indexering'));
});

test('experiment cap matches the existing SEO growth loop', () => {
  assert.equal(cfg.experiment_rule.max_changes_per_day, loop.optimization.max_high_confidence_changes_per_daily_cycle);
});

test('linkedin link rule carries UTM and a minimum link share', () => {
  assert.match(cfg.linkedin_distribution.rule, /utm_source=linkedin/);
  assert.ok(cfg.linkedin_distribution.min_link_share >= 0.33);
});
