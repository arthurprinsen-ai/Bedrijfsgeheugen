import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyDailySteeringPositioning } from '../tools/site-shell/apply-daily-steering-positioning.mjs';

const homepage=readFileSync('index.html','utf8');

test('actual homepage starts with why daily operating decisions matter, not an AI-feature pitch',()=>{
  const result=applyDailySteeringPositioning(homepage,'nl');
  assert.match(result,/data-bg-daily-steering-title="v1"/);
  assert.match(result,/Je bedrijf verandert elke dag/);
  assert.match(result,/Je besturing moet mee/);
  assert.match(result,/binnen én buiten je onderneming/);
  assert.match(result,/strategie, doelen, mensen, processen en financiën/);
  assert.match(result,/data-bg-daily-steering-copy="v1"/);
  assert.match(result,/DAGELIJKSE ONDERNEMINGSSTURING/);
  assert.match(result,/Van verandering naar actie en resultaat/);
  assert.match(result,/Een chatbot geeft antwoord/);
  assert.ok(result.includes('href="/frisse-blik"'),'original call-to-action remains');
  assert.equal((result.match(/data-bg-daily-steering-title="v1"/g)||[]).length,1);
  assert.equal(applyDailySteeringPositioning(result,'nl'),result,'idempotence: no second hero');
});

test('English public homepage has its own natural positioning, without machine translation',()=>{
  const fixture='<html><head></head><body><main><section class="hero"><h1>Peace of mind in your business</h1><p class="hand">Get it done.</p><p class="lead">Knowledge in mailboxes.</p></section><section class="aieco" data-section="ai-ecosysteem"><span class="eyebrow">POWERHOUSE AI</span><h2>Not one AI tool</h2><p class="lead">Many agents.</p></section></main></body></html>';
  const result=applyDailySteeringPositioning(fixture,'en');
  assert.match(result,/Your business changes every day/);
  assert.match(result,/outside your business/);
  assert.match(result,/EVERYDAY BUSINESS STEERING/);
  assert.match(result,/Beyond insights/);
  assert.equal(applyDailySteeringPositioning(result,'en'),result);
});

test('homepage positioning runs after locale rendering and coherence but before final release evidence',()=>{
  const pipeline=readFileSync('tools/ci/netlify-build-entry.mjs','utf8');
  const locale=pipeline.indexOf("['localized-routes'");
  const coherence=pipeline.indexOf("['website-coherence'");
  const steering=pipeline.indexOf("['daily-steering-positioning'");
  const release=pipeline.indexOf("['release-evidence'");
  assert.ok(locale>0&&coherence>locale&&steering>coherence&&release>steering);
  assert.match(pipeline,/tools\/site-shell\/apply-daily-steering-positioning\.mjs/);
});

test('never mistake a missing main or missing hero for successful positioning',()=>{
  assert.throws(()=>applyDailySteeringPositioning('<html></html>','nl'),/DAILY_STEERING_NO_MAIN/);
  assert.throws(()=>applyDailySteeringPositioning('<main></main>','nl'),/DAILY_STEERING_NO_H1/);
});
