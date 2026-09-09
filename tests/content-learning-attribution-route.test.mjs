import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAttributionRedirect } from '../lib/content-learning/attribution-redirect.mjs';

test('redirects only from an opaque key resolved server-side', async () => {
  const calls = [];
  const result = await resolveAttributionRedirect('abc123', {
    now: new Date('2026-09-09T18:00:00Z'),
    loadLink: async key => key === 'abc123' ? {
      key,
      destination: 'https://www.bedrijfsgeheugen.nl/frisse-blik',
      campaign_key: 'li-frisse-blik-01',
      status: 'active',
      expires_at: '2026-10-01T00:00:00Z'
    } : null,
    recordClick: async event => calls.push(event)
  });
  assert.equal(result.status, 302);
  assert.equal(result.location, 'https://www.bedrijfsgeheugen.nl/frisse-blik');
  assert.equal(calls[0].campaign_key, 'li-frisse-blik-01');
});

test('unknown key is 404 and never uses caller supplied destination', async () => {
  const result = await resolveAttributionRedirect('missing', { loadLink: async () => null, recordClick: async () => {} });
  assert.equal(result.status, 404);
  assert.equal(result.location, null);
});

test('expired or disabled key is gone', async () => {
  for (const link of [
    { destination: 'https://www.bedrijfsgeheugen.nl/', status: 'disabled' },
    { destination: 'https://www.bedrijfsgeheugen.nl/', status: 'active', expires_at: '2026-09-01T00:00:00Z' }
  ]) {
    const result = await resolveAttributionRedirect('x', { now: new Date('2026-09-09T18:00:00Z'), loadLink: async () => link, recordClick: async () => {} });
    assert.equal(result.status, 410);
  }
});

test('rejects non-https and non-Bedrijfsgeheugen destinations', async () => {
  for (const destination of ['javascript:alert(1)', 'http://www.bedrijfsgeheugen.nl/', 'https://evil.example/']) {
    const result = await resolveAttributionRedirect('x', { loadLink: async () => ({ destination, status: 'active' }), recordClick: async () => {} });
    assert.equal(result.status, 410);
  }
});
