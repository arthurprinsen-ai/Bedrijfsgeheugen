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


test('business-owner value appears before technical detail in both languages with explicit evidence boundaries',()=>{
  const nl=applyDailySteeringPositioning(homepage,'nl');
  assert.match(nl,/data-bg-business-value-first="v1"/);
  assert.match(nl,/Wat levert een betere beslissing jouw bedrijf op/);
  assert.match(nl,/Een kans is nog geen extra order/);
  assert.match(nl,/een besparingsschatting is nog geen besparing/i);
  assert.match(nl,/voorbeeldgegevens/);
  assert.match(nl,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/zelfscan"/);
  assert.ok(nl.indexOf('data-bg-business-value-first="v1"')>nl.indexOf('<h1>'),'business value follows the original first-screen H1');
  assert.equal((nl.match(/data-bg-business-value-first="v1"/g)||[]).length,1);
  assert.equal(applyDailySteeringPositioning(nl,'nl'),nl,'repeated builds must not stack duplicate sections');
  const en=applyDailySteeringPositioning('<main><h1>Original</h1><p class="lead">Original lead</p></main>','en');
  assert.match(en,/What does a better decision deliver/);
  assert.match(en,/Estimated savings are not realised savings/);
  assert.equal(applyDailySteeringPositioning(en,'en'),en);
});


test('value-first homepage keeps the original cookie choices and tablet main heading visible',()=>{
 const nl=applyDailySteeringPositioning(homepage,'nl');
 assert.match(nl,/@media\(min-width:620px\) and \(max-width:900px\)/);
 assert.match(nl,/html body #bgCookie\{width:min\(320px,calc\(100vw - 2rem\)\)/);
 assert.match(nl,/right:1rem;margin:0/);
 assert.doesNotMatch(nl,/#bgCookie\s*\{[^}]*display:none!important/);
 assert.match(nl,/id="bgCookieDeny"/);
 assert.match(nl,/id="bgCookieAccept"/);
 assert.equal(applyDailySteeringPositioning(nl,'nl'),nl);
 const en=applyDailySteeringPositioning('<main><h1>Original</h1><p class="lead">Original lead</p></main>','en');
 assert.match(en,/@media\(min-width:620px\) and \(max-width:900px\)/);
});


test('business-value section respects hero-first visual safety for phone tablet and desktop',()=>{
 const fixture='<html><main><section class="hero"><h1>FIRST SCREEN HERO</h1><p class="hero-sub">An original, first-screen business introduction.</p></section><section data-section="ai-ecosysteem"><h2>Existing details</h2></section></main></html>';
 for(const locale of ['nl','en']){
   const result=applyDailySteeringPositioning(fixture,locale);
   const position=result.indexOf('data-bg-business-value-first="v1"');
   assert.ok(position>result.indexOf('FIRST SCREEN HERO'),'the first-screen H1 must remain visible before the secondary value block');
   assert.ok(position>result.indexOf('</section>'),'value block follows the complete first hero section');
   assert.equal((result.match(/data-bg-business-value-first="v1"/g)||[]).length,1);
   assert.equal(applyDailySteeringPositioning(result,locale),result,'no duplicated product section on repeat build');
 }
});


test('value-first placement follows actual nested DIV hero after predictive content',()=>{
  const markup='<main><section aria-labelledby="bg-predictive-heading"><h2 id="bg-predictive-heading">Details</h2></section><div class="wrap hero"><div><h1>Original entrepreneur headline</h1><div class="actions"><a href="/product">Original CTA</a></div></div><aside>Original hero aside</aside></div><section id="next">Next</section></main>';
  const output=applyDailySteeringPositioning(markup,'nl');
  assert.ok(output.indexOf('data-bg-business-value-first="v1"')>output.indexOf('Original hero aside'));
  assert.ok(output.indexOf('data-bg-business-value-first="v1"')<output.indexOf('id="next"'));
  assert.equal((output.match(/data-bg-business-value-first="v1"/g)||[]).length,1);
  assert.equal(applyDailySteeringPositioning(output,'nl'),output);
});


test('the production H1 is visible before technical predictive detail after the safe reorder',()=>{
 const output=applyDailySteeringPositioning(homepage,'nl');
 const h1=output.indexOf('data-bg-daily-steering-title="v2"');
 const value=output.indexOf('data-bg-business-value-first="v1"');
 const predictive=output.indexOf('aria-labelledby="bg-predictive-heading"');
 assert.ok(h1>0&&value>h1&&predictive>value,'existing hero must precede value and predictions');
 const firstChild=/<main\b[^>]*>\s*<div\b[^>]*class=["'][^"']*\bhero\b[^"']*["']/i;
 assert.match(output,firstChild,'the first main block is the original visible hero');
 assert.equal(applyDailySteeringPositioning(output,'nl'),output);
});

test('real homepage technical section cannot push original owner hero below the fold',()=>{
  const first='<main><section class="wrap" aria-labelledby="bg-predictive-heading"><h2 id="bg-predictive-heading">Predictive models</h2><p>Predictions need verified data.</p><div><span>Evidence</span></div></section>';
  const hero='<div class="wrap hero"><div><h1>Original business headline</h1><p class="lead">Original context</p><div class="inner"><a href="/product">Product</a></div></div><aside>Original hero proof</aside></div>';
  const input=first+hero+'<section id="more"><h2>Further details</h2></section></main>';
  const result=applyDailySteeringPositioning(input,'nl');
  assert.ok(result.indexOf('<div class="wrap hero">')<result.indexOf('bg-predictive-heading'),'real hero must precede secondary technical panel');
  assert.ok(result.indexOf('data-bg-business-value-first="v1"')<result.indexOf('bg-predictive-heading'),'business value shown before explanatory technology');
  assert.match(result,/Predictions need verified data/,'uncertainty disclaimer preserved');
  assert.match(result,/Original hero proof/);
  assert.equal(applyDailySteeringPositioning(result,'nl'),result);
});


test('generated V18 video-hero shade never becomes the owner-value injection point',()=>{
 const fixture='<main data-bg-component="main"><div class="page active" id="view-home"><section aria-label="Bedrijfsgeheugen introductie" class="hero-video hero-inspiration" data-bg-component="hero"><video aria-hidden="true"></video><div class="hero-video-shade"></div><div class="wrap hero-video-content"><div class="hero-copy"><h1>Original business-owner promise</h1><p class="hero-sub">Original outcomes and evidence</p></div></div></section><section id="after-video"><h2>Further content</h2></section></div></main>';
 const html=applyDailySteeringPositioning(fixture,'nl');
 const h1=html.indexOf('data-bg-daily-steering-title="v2"');
 const heroClose=html.indexOf('</section>',h1);
 const insertion=html.indexOf('data-bg-business-value-first="v1"');
 const next=html.indexOf('id="after-video"');
 assert.ok(h1>0&&heroClose>h1&&insertion>heroClose&&next>insertion,'V18 original H1 and complete hero must precede new section');
 assert.ok(html.includes('<div class="hero-video-shade"></div>'),'video overlay preserved');
 assert.equal((html.match(/data-bg-business-value-first="v1"/g)||[]).length,1);
 assert.equal(applyDailySteeringPositioning(html,'nl'),html,'V18-shaped build remains idempotent');
});

test('homepage reordering rejects comment-based pre-hero markup instead of partial sanitization',()=>{
 const html='<main><section aria-labelledby="bg-predictive-heading"><h2 id="bg-predictive-heading">Evidence</h2></section><!-- nested <!-- unsupported --><div class="wrap hero"><h1>Primary entrepreneur proposition</h1><p class="lead">Real source context</p></div></main>';
 assert.throws(()=>applyDailySteeringPositioning(html,'nl'),/VALUE_FIRST_PRE_HERO_COMMENT_UNSUPPORTED/);
});
