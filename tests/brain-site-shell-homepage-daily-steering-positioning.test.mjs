import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyDailySteeringPositioning } from '../tools/site-shell/apply-daily-steering-positioning.mjs';

const homepage=readFileSync('index.html','utf8');

test('actual homepage starts with why daily operating decisions matter, not an AI-feature pitch',()=>{
  const result=applyDailySteeringPositioning(homepage,'nl');
  assert.match(result,/data-bg-daily-steering-title="v2"/);
  assert.match(result,/Je bedrijf verandert elke dag/);
  assert.match(result,/Je besturing moet mee/);
  assert.match(result,/binnen én buiten je onderneming/);
  assert.match(result,/strategie, doelen, mensen, processen en financiën/);
  assert.match(result,/data-bg-daily-steering-copy="v2"/);
  assert.match(result,/DAGELIJKSE ONDERNEMINGSSTURING/);
  assert.match(result,/Van verandering naar actie en resultaat/);
  assert.match(result,/Een chatbot geeft antwoord/);
  assert.ok(result.includes('href="/frisse-blik"'),'original call-to-action remains');
  assert.equal((result.match(/data-bg-daily-steering-title="v2"/g)||[]).length,1);
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

test('live-shaped hero replaces the old knowledge pitch rather than stacking a second paragraph',()=>{
  const fixture=`<html><body><main><section class="hero-video"><div class="hero-copy">
<div class="hero-kicker"><span></span> AI-gedreven. Menselijk gericht.</div>
<h1>Rust in je bedrijf. Grip op wat er speelt.</h1>
<div class="handline">Aanpakken zonder aanmodderen.</div><p class="hero-sub">Je bedrijf heeft een geheugen. Alleen zit te veel ervan nog in hoofden, mailboxen, Excel en losse systemen.</p>
<a href="https://www.bedrijfsgeheugen.nl/zelfscan">Zelfscan</a>
</div></section>
<section class="bg-ai-ecosysteem" data-section="ai-ecosysteem">
<span class="bg-ai-eyebrow">POWERHOUSE · AI-ECOSYSTEEM</span>
<h2>Niet één AI-tool. Een bedrijf dat samenwerkt.</h2>
<p class="bg-ai-lead">Bedrijfsgeheugen verbindt bedrijfsdata.</p>
<div class="bg-ai-agents" aria-label="Voorbeelden van AI-agents"><span>Sales-agent</span><span>HR-agent</span></div>
<a href="https://www.bedrijfsgeheugen.nl/ai-ecosysteem">Bekijk het AI-ecosysteem →</a>
</section></main></body></html>`;
  const nl=applyDailySteeringPositioning(fixture,'nl');
  assert.match(nl,/Iedere dag beter sturen/);
  assert.match(nl,/<p class="hero-sub" data-bg-daily-steering-copy="v2">/);
  assert.equal((nl.match(/data-bg-daily-steering-copy="v2"/g)||[]).length,1);
  assert.doesNotMatch(nl,/Je bedrijf heeft een geheugen\. Alleen zit te veel/);
  assert.doesNotMatch(nl,/<p class="lead" data-bg-daily-steering-copy/);
  assert.doesNotMatch(nl,/Voorbeelden van AI-agents/);
  assert.match(nl,/Kansen eerder herkennen/);
  assert.match(nl,/Bekijk de technologie erachter/);
  assert.ok(nl.includes('href="https://www.bedrijfsgeheugen.nl/zelfscan"'));
  assert.equal(applyDailySteeringPositioning(nl,'nl'),nl);
  const en=applyDailySteeringPositioning(fixture.replace('Voorbeelden van AI-agents','Examples of AI agents'),'en');
  assert.match(en,/Better decisions, every day/);
  assert.match(en,/Value for business owners/);
  assert.match(en,/Spot opportunities sooner/);
  assert.equal((en.match(/data-bg-daily-steering-copy="v2"/g)||[]).length,1);
});

test('v1 production copy upgrades without stacking or leaving the outdated hero-sub',()=>{
  const legacy=`<html><body><main><section class="hero">
<h1 data-bg-daily-steering-title="v1">Je bedrijf verandert elke dag. Je besturing moet mee.</h1>
<p class="lead" data-bg-daily-steering-copy="v1">Bedrijfsgeheugen verbindt wat er binnen gebeurt.</p>
<div class="handline">Aanpakken zonder aanmodderen.</div>
<p class="hero-sub">Je bedrijf heeft een geheugen. Alleen zit te veel ervan in hoofden.</p>
</section></main></body></html>`;
  const updated=applyDailySteeringPositioning(legacy,'nl');
  assert.doesNotMatch(updated,/data-bg-daily-steering-copy="v1"/);
  assert.doesNotMatch(updated,/Je bedrijf heeft een geheugen\. Alleen/);
  assert.match(updated,/<p class="hero-sub" data-bg-daily-steering-copy="v2">/);
  assert.equal((updated.match(/data-bg-daily-steering-copy="v2"/g)||[]).length,1);
  assert.equal(applyDailySteeringPositioning(updated,'nl'),updated);
});
