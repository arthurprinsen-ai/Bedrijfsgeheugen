import test from 'node:test';
import assert from 'node:assert/strict';
import { mapGrowthObservationToPowerhouseEvent } from '../tools/seo-growth/powerhouse-core-map.mjs';

test('SEO observation maps to canonical core evidence',()=>{
  const event=mapGrowthObservationToPowerhouseEvent({event_id:'e1',event_type:'page_view',canonical:'https://www.bedrijfsgeheugen.nl/blog/test',intent_id:'ai-mkb',occurred_at:'2026-09-09T06:00:00Z',page_role:'blog',funnel_stage:'discover',source:'google',medium:'organic'});
  assert.equal(event.eventType,'seo_metric_observed');
  assert.equal(event.topicKey,'ai-mkb');
  assert.match(event.contentKey,/^url:/);
  assert.equal(event.channel,'website');
});

test('conversion observation maps to website_conversion',()=>{
  const event=mapGrowthObservationToPowerhouseEvent({event_id:'e2',event_type:'cta_conversion',canonical:'https://www.bedrijfsgeheugen.nl/frisse-blik',occurred_at:'2026-09-09T06:00:00Z',funnel_stage:'conversion'});
  assert.equal(event.eventType,'website_conversion');
});

test('published blog signal becomes blog_published',()=>{
  const event=mapGrowthObservationToPowerhouseEvent({event_id:'e3',event_type:'blog_published',canonical:'https://www.bedrijfsgeheugen.nl/blog/nieuw',occurred_at:'2026-09-09T06:00:00Z'});
  assert.equal(event.eventType,'blog_published');
});
