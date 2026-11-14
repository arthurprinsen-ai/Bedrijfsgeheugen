import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveMiraNewsPublisherUrl} from '../supabase/functions/_shared/mira-dataforseo-publisher-url.mjs';
import {classifyMiraSourceUrl} from '../supabase/functions/_shared/mira-source-url-quality.mjs';

const redirect='https://www.google.com/url?sa=t&url=https%3A%2F%2Fwww.nu.nl%2Feconomie%2F123%2Fmkb-onbetaalde-facturen.html';
const qredirect='https://www.google.nl/url?q=https%3A%2F%2Faccountancyvanmorgen.nl%2F2026%2F11%2F11%2Fondernemers-facturen';
test('source guard still refuses raw Google redirects; only adapter accepts literal linked publisher with matching domain',()=>{
  assert.equal(classifyMiraSourceUrl(redirect).ok,false);
  const got=resolveMiraNewsPublisherUrl({url:redirect,providerDomain:'nu.nl'});
  assert.equal(got.ok,true);
  assert.equal(got.kind,'GOOGLE_WRAPPER_VERIFIED_PUBLISHER_URL');
  assert.equal(got.url,'https://www.nu.nl/economie/123/mkb-onbetaalde-facturen.html');
  assert.equal(classifyMiraSourceUrl(got.url).ok,true);
  assert.equal(got.source_url_shape.host,'google.com');
  assert.deepEqual(got.source_url_shape.parameter_keys,['sa','url']);
  assert.equal(resolveMiraNewsPublisherUrl({url:qredirect,providerDomain:'www.accountancyvanmorgen.nl'}).ok,true);
});
test('direct real publisher URL is retained, never silently rewritten or imagined',()=>{
  const original='https://www.tweakers.net/nieuws/123/werkgevers-klagen.html';
  assert.deepEqual(resolveMiraNewsPublisherUrl({url:original,providerDomain:'tweakers.net'}).url,original);
  assert.equal(resolveMiraNewsPublisherUrl({url:'https://www.google.com/url?sa=t',providerDomain:'nu.nl'}).ok,false);
});
test('opaque Google News articles, search links and non-google intermediaries never pass',()=>{
  for(const url of ['https://news.google.com/articles/CAIqlg','https://www.google.com/search?q=ondernemers',
    'https://duckduckgo.com/l/?uddg=https%3A%2F%2Fnu.nl%2Feconomie%2F1',
    'https://www.google.com/aclk?url=https%3A%2F%2Fnu.nl%2Feconomie%2F1'])
    assert.equal(resolveMiraNewsPublisherUrl({url,providerDomain:'nu.nl'}).ok,false,url);
});
test('spoofed, mismatched, internal, insecure and nested destinations are rejected',()=>{
  const urls=[
    'https://www.google.com/url?url=https%3A%2F%2Fnu.nl.evil.example%2Farticle',
    'https://www.google.com/url?url=http%3A%2F%2Fnu.nl%2Farticle',
    'https://www.google.com/url?url=https%3A%2F%2F127.0.0.1%2Farticle',
    'https://www.google.com/url?url=https%3A%2F%2Flocalhost%2Farticle',
    'https://www.google.com/url?url=https%3A%2F%2Fuser%3Apass%40nu.nl%2Farticle',
    'https://www.google.com/url?url=https%3A%2F%2Fnu.nl%3A8443%2Farticle',
    'https://www.google.com/url?url=https%3A%2F%2Fnu.nl%2Fout%3Furl%3Dhttps%3A%2F%2Fevil.example',
    'https://www.google.com/url?url=https%3A%2F%2Fnu.nl%2F',
    'https://www.google.com/url?url=https%3A%2F%2Fnu.nl%2Farticle&q=https%3A%2F%2Fevil.example%2Fx'
  ];
  for(const url of urls)assert.equal(resolveMiraNewsPublisherUrl({url,providerDomain:'nu.nl'}).ok,false,url);
  assert.equal(resolveMiraNewsPublisherUrl({url:redirect,providerDomain:'fake.nl'}).ok,false);
  assert.equal(resolveMiraNewsPublisherUrl({url:redirect,providerDomain:'google.com'}).ok,false);
  assert.equal(resolveMiraNewsPublisherUrl({url:redirect}).ok,false);
});
test('original PH-P dated source, score, dedupe and unique source winner remain absolute',()=>{
 const radar=readFileSync('supabase/functions/powerhouse-mira-problem-radar/index.ts','utf8');
 for(const value of [
  "authorizePowerhouseScheduler(req)","const sourceUrl=String(resolved.url||x.url||'').trim()",
  "resolveMiraNewsPublisherUrl({url:x.url,providerDomain:x.publisherDomain})",
  "publisherDomain:String(y.domain||'')",
  "classifyMiraSourceUrl(sourceUrl).ok",
  "evaluateMiraPublicationFreshness(","eligible:total>=0.72&&publication.eligible",
  "priorContract && priorContract!==row.metadata.contract",
  "powerhouse_materialize_mira_problem_recommendation_v1",
  "brain_observe_failure",
  "classifyMiraRadarHttpStatus({sourceReady:supply.ok,errors})",
  "sendsAuthorized:false"
 ])assert.ok(radar.includes(value),value);
 assert.match(radar,/MAX_AGE_DAYS=45/);
 assert.match(radar,/selectCanonicalRadarSourceQueries\(runDate\)/);
 assert.doesNotMatch(radar,/cron\.schedule\(|INSTAGRAM_POST_IG_USER_MEDIA_PUBLISH|MAKE_WEBHOOK/);
});
