import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeBehaviorEvent } from '../tools/seo-growth/normalize-observation.mjs';
import { normalizeGrowthEventForDataHub } from '../tools/seo-growth/datahub-contract.mjs';

test('content identity survives website observation and datahub normalization', () => {
  const observation=normalizeBehaviorEvent({event_id:'e1',event_type:'primary_cta_click',canonical:'https://www.bedrijfsgeheugen.nl/blog/foo/',content_id:'blog:foo',content_type:'blog',channel:'website'});
  assert.equal(observation.content_id,'blog:foo');
  assert.equal(observation.content_type,'blog');
  const hub=normalizeGrowthEventForDataHub({event_id:observation.event_id,event_type:observation.event_type,canonical:observation.canonical,content_id:observation.content_id,content_type:observation.content_type,channel:observation.channel});
  assert.equal(hub.content_id,'blog:foo');
  assert.equal(hub.content_type,'blog');
  assert.equal(hub.channel,'website');
});

test('production growth endpoint forwards content identity to DataHub', () => {
  const text=fs.readFileSync('netlify/functions/growth-event.mjs','utf8');
  assert.match(text,/content_id:observation\.content_id/);
  assert.match(text,/content_type:observation\.content_type/);
  assert.match(text,/channel:observation\.channel/);
});
