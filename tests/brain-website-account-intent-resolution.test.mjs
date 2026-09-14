import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveWebsiteAccountIntent,
  WEBSITE_ACCOUNT_INTENT_CONTRACT,
} from '../brain/knowledge/website-account-intent.mjs';

const now = () => '2026-09-14T13:30:00.000Z';

const event = (overrides = {}) => ({
  event_id: 'evt-1',
  occurred_at: '2026-09-14T13:00:00.000Z',
  canonical: 'https://www.bedrijfsgeheugen.nl/afas-koppeling',
  page_role: 'money',
  funnel_stage: 'consideration',
  intent: 'afas-koppeling',
  session_id: 'session-1',
  anonymous_id: 'anon-1',
  ...overrides,
});

test('resolves a known website visitor to one company and emits evidence-backed account intent', async () => {
  const resolverCalls = [];
  const result = await resolveWebsiteAccountIntent({
    events: [
      event(),
      event({ event_id: 'evt-2', canonical: 'https://www.bedrijfsgeheugen.nl/frisse-blik', page_role: 'conversion', funnel_stage: 'decision', occurred_at: '2026-09-14T13:05:00.000Z' }),
    ],
    accountResolvers: [{
      id: 'resolver-a',
      priority: 10,
      async resolve(input) {
        resolverCalls.push(input.anonymous_id);
        return { company_id: 'company:acme', company_name: 'Acme BV', confidence: 0.92, source_ref: 'resolver-a:acme' };
      },
    }],
    now,
  });

  assert.deepEqual(resolverCalls, ['anon-1']);
  assert.equal(result.account.company_id, 'company:acme');
  assert.equal(result.account.company_name, 'Acme BV');
  assert.equal(result.events.length, 2);
  assert.ok(result.intent.score >= 0.7);
  assert.ok(result.intent.confidence >= 0.8);
  assert.equal(result.intent.evidence.length, 2);
  assert.equal(result.signal.type, 'website_intent');
  assert.equal(result.signal.entity_id, 'company:acme');
});

test('fails closed when no account resolver can identify the visitor', async () => {
  const result = await resolveWebsiteAccountIntent({
    events: [event()],
    accountResolvers: [{ id: 'resolver-a', priority: 10, async resolve() { return null; } }],
    now,
  });

  assert.equal(result.account, null);
  assert.equal(result.signal, null);
  assert.equal(result.activation_allowed, false);
  assert.equal(result.reason, 'account-unresolved');
});

test('deduplicates event ids and gives recent high-intent conversion pages more weight', async () => {
  const highIntent = event({ event_id: 'evt-high', canonical: 'https://www.bedrijfsgeheugen.nl/contact', page_role: 'conversion', funnel_stage: 'decision', occurred_at: '2026-09-14T13:25:00.000Z' });
  const duplicate = { ...highIntent };
  const weakIntent = event({ event_id: 'evt-weak', canonical: 'https://www.bedrijfsgeheugen.nl/blog/foo', page_role: 'editorial', funnel_stage: 'awareness', occurred_at: '2026-09-10T13:25:00.000Z' });

  const result = await resolveWebsiteAccountIntent({
    events: [weakIntent, highIntent, duplicate],
    accountResolvers: [{ id: 'resolver-a', priority: 10, async resolve() { return { company_id: 'company:acme', confidence: 0.9, source_ref: 'resolver-a:acme' }; } }],
    now,
  });

  assert.equal(result.events.length, 2);
  assert.ok(result.intent.score > 0.65);
  assert.equal(result.intent.evidence[0].event_id, 'evt-high');
});

test('contract explicitly feeds canonical knowledge and opportunity recalculation rather than a parallel visitor store', () => {
  assert.equal(WEBSITE_ACCOUNT_INTENT_CONTRACT.canonicalTruth, 'Company Graph / Canonical State');
  assert.equal(WEBSITE_ACCOUNT_INTENT_CONTRACT.parallelVisitorTruthStore, false);
  assert.equal(WEBSITE_ACCOUNT_INTENT_CONTRACT.nextDecision, 'recalculate_opportunity');
});
