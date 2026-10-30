import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeBehaviorEvent} from '../tools/seo-growth/normalize-observation.mjs';
import {normalizeGrowthEventForDataHub} from '../tools/seo-growth/datahub-contract.mjs';

test('existing consented CRO event retains canonical CMS editorial lineage without extra writer',async()=>{
 const tracker=await readFile(new URL('../assets/meting.js',import.meta.url),'utf8');
 const cmsRuntime=await readFile(new URL('../assets/cms-runtime.js',import.meta.url),'utf8');
 assert.match(cmsRuntime,/setAttribute\('data-bg-cms-key'/);
 assert.match(cmsRuntime,/setAttribute\('data-bg-cms-version'/);
 assert.match(tracker,/function cmsContentId\(el\)/);
 assert.match(tracker,/node\.closest\('\[data-bg-cms-key\]\[data-bg-cms-version\]'\)/);
 assert.match(tracker,/event\.content_id=cmsId/);
 assert.match(tracker,/if\(gebied!=='site'\|\|!toestemming\(\)\)return/);
 assert.match(tracker,/document\.getElementById\('bg-growth-measurement'\)/);
 assert.match(tracker,/meetGroei\('primary_cta_click',el\)/);
 assert.match(tracker,/meetGroei\('form_submit_intent',f\)/);
 assert.equal((tracker.match(/fetch\('\/api\/growth-event'/g)||[]).length,1,'retain only original event producer');
});

test('existing DataHub normalizer preserves bounded CMS key/version as page content ID',()=>{
 const content_id='cms:portal.nav.manage:v7';
 const source={
  event_id:'evt-cms-a',event_type:'primary_cta_click',
  canonical:'https://www.bedrijfsgeheugen.nl/portal-v2/',
  intent_id:'/portal-v2/',source:'website',medium:'direct',
  channel:'website',content_type:'page',content_id
 };
 const event=normalizeBehaviorEvent(source);
 assert.equal(event.content_id,content_id);
 assert.equal(event.content_type,'page');
 const mapped=normalizeGrowthEventForDataHub({
  event_id:event.event_id,event_type:event.event_type,canonical:event.canonical,
  content_id:event.content_id,content_type:event.content_type,
  source:event.source,medium:event.medium,channel:event.channel,
  fingerprint:event.fingerprint
 });
 assert.equal(mapped.content_id,content_id);
 assert.equal(mapped.content_type,'page');
 assert.equal(mapped.event_id,source.event_id);
});

test('CMS attribution is not an independent payment, user identity, or synthetic success',()=>{
 const tracker='cms:website.hero.cta:v14';
 const event=normalizeBehaviorEvent({event_id:'evt-b',event_type:'money_link_click',
  canonical:'https://www.bedrijfsgeheugen.nl/prijzen/',content_id:tracker,content_type:'page'});
 assert.equal(event.content_id,tracker);
 assert.equal(event.kind,'behavior');
 assert.equal('revenue_eur' in event,false);
 assert.equal('verified_orders' in event,false);
});
