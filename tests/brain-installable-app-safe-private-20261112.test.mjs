import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pub=JSON.parse(read('assets/app.webmanifest'));
const portal=JSON.parse(read('portal-v2/app.webmanifest'));
const guard='website|portal|one-installable-app-feel-safe-offline-and-tablet-dock|20261112-v1';

test('manifest historical acceptance: two installs share real branding, stay in exact respective scope',()=>{
 assert.equal(pub.id,'/');
 assert.equal(pub.start_url,'/');
 assert.equal(pub.scope,'/');
 assert.equal(portal.id,'/portal-v2/');
 assert.equal(portal.start_url,'/portal-v2/');
 assert.equal(portal.scope,'/portal-v2/');
 for(const [name,m] of [['public',pub],['portal',portal]]){
  assert.equal(m.display,'standalone',name);
  assert.equal(m.prefer_related_applications,false,name);
  assert.equal(m.lang,'nl-NL',name);
  assert.equal(m.orientation,'any',name);
  assert.ok(m.theme_color&&m.background_color,name);
  assert.ok(m.icons.some(x=>x.sizes==='192x192'&&x.type==='image/svg+xml'));
  assert.ok(m.icons.some(x=>x.sizes==='512x512'&&x.type==='image/png'));
  for(const icon of m.icons)assert.ok(existsSync(new URL('..'+icon.src,import.meta.url)),icon.src);
  for(const item of m.shortcuts||[]){
   assert.ok(item.url.startsWith(m.scope),name+' shortcut out of scope: '+item.url);
   assert.ok(!item.url.includes('token='),name+' must never carry a token');
  }
 }
 assert.match(read('assets/merk/app-icon-192.svg'),/width="192" height="192"/);
});

test('private-data safety: only public static offline document cached; network only for all customer navigations',()=>{
 const worker=read('assets/app-sw.js');
 assert.match(worker,/const OFFLINE_URL='\/app-offline.html'/);
 assert.match(worker,/cache\.add\(OFFLINE_URL\)/);
 assert.match(worker,/request\.mode!=='navigate'/);
 assert.match(worker,/url\.origin!==self\.location\.origin/);
 assert.match(worker,/event\.respondWith\(fetch\(request\)\.catch/);
 assert.doesNotMatch(worker,/caches\.put\(|cache\.put\(|POST|sync\.register|BackgroundFetch|idb|indexedDB|localStorage|sessionStorage/);
 const offline=read('assets/app-offline.html');
 assert.match(offline,/geen oude bedrijfsinformatie als actueel/);
 assert.match(offline,/voeren we geen acties uit/);
 assert.match(offline,/https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\//);
 assert.doesNotMatch(offline,/Authorization|access_token|refresh_token/);
 assert.doesNotMatch(offline,/onclick=|onload=/);
 const delivery=JSON.parse(read('config/brain-delivery-system.json'));
 const website=delivery.lanes.find(lane=>lane.id==='website');
 assert.ok(website.paths.includes('assets/'),'original classified public assets lane must exist');
 const deployment=read('netlify.toml');
 assert.match(deployment,/for = "\\/assets\\/app-sw\\.js"/);
 assert.match(deployment,/Service-Worker-Allowed = "\\/"/);
});

test('public website and private portal opt into their own manifest with real full HTTPS hrefs',()=>{
 const home=read('index.html'),entry=read('portal-v2/index.html');
 assert.match(home,/rel="manifest" href="https:\/\/www\.bedrijfsgeheugen\.nl\/assets\/app\.webmanifest"/);
 assert.match(entry,/rel="manifest" href="https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\/assets\/app\.webmanifest"/);
 for(const [name,html] of [['home',home],['portal',entry]]){
  assert.match(html,/viewport-fit=cover/,name);
  assert.match(html,/apple-mobile-web-app-capable/,name);
  assert.match(html,/apple-mobile-web-app-title/,name);
  assert.match(html,/https:\/\/www\.bedrijfsgeheugen\.nl\/apple-touch-icon\.png/,name);
  assert.match(html,/https:\/\/www\.bedrijfsgeheugen\.nl\/assets\/app-standalone\.js\?v=20261112/,name);
 }
 assert.match(entry,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\/app-feel\.css\?v=20261112"/);
});

test('tablet shadow: original body-mounted dock now fills the 761–900px dead zone',()=>{
 const css=read('portal-v2/app-feel.css');
 const app=read('portal-v2/app.js');
 const nav=read('portal-v2/navigation.css');
 assert.match(css,/@media\(min-width:761px\) and \(max-width:900px\)/);
 assert.match(css,/\.portal-mobile-primary\{[\s\S]*?display:grid/);
 assert.match(css,/\.app \.portal-hamburger\{display:none!important\}/);
 assert.match(css,/body:has\(\.allpages\.open\) \.portal-mobile-primary/);
 assert.match(css,/env\(safe-area-inset-bottom\)/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/:focus-visible/);
 assert.doesNotMatch(css,/\.app \.portal-mobile-primary\{/);
 assert.match(app,/document\.body\.appendChild\(nav\)/);
 for(const page of ["['overzicht'","['actieve-acties'","['outcomes-evidence'","['hub:portal'"])assert.ok(app.includes(page));
 assert.match(nav,/\.portal-mobile-primary/);
});

test('public site uses the one existing cross-page mobile builder with native-feeling feedback',()=>{
 const css=read('assets/sitewide-mobile-ui-20261111.css');
 const builder=read('tools/site-shell/apply-cms-runtime.mjs');
 assert.match(builder,/sitewide-mobile-ui-20261111\.css/);
 assert.match(css,/display-mode:standalone/);
 assert.match(css,/touch-action:manipulation/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/safe-area-inset-top/);
 assert.match(css,/main :is\(\.hero-actions,\.pgl-actions,\.cta-row\)/);
});

test('native install affordance only on real browser eligibility, does not register another business executor',()=>{
 const script=read('assets/app-standalone.js');
 assert.match(script,/beforeinstallprompt/);
 assert.match(script,/appinstalled/);
 assert.match(script,/navigator\.serviceWorker\.register\('\/assets\/app-sw\.js'/);
 assert.match(script,/portalAccountPanel \.portal-popover-links/);
 assert.match(script,/navigator\.standalone===true/);
 assert.match(script,/Zet op beginscherm/);
 assert.match(script,/original\.prompt\(\)/);
 assert.doesNotMatch(script,/fetch\(|localStorage|sessionStorage|new Worker\(|setInterval\(|navigator\.serviceWorker\.controller\.postMessage/);
 assert.doesNotThrow(()=>new Function(script));
 assert.doesNotThrow(()=>new Function(read('assets/app-sw.js')));
});

test('learning and original agents/skills cover one design system and fail-closed consent',()=>{
 const team=read('platform/agents/agent-team.mjs');
 const agents=read('AGENTS.md');
 const portalSkill=read('.agents/skills/portal-living-interface/SKILL.md');
 const websiteSkill=read('skills/website-portal-coherence.md');
 assert.match(team,/verify-installable-website-and-portal-app-shell-and-tablet-portrait-original-four-route-dock/);
 for(const [name,s] of Object.entries({agents,portalSkill,websiteSkill})){
  assert.ok(s.includes(guard),name);
  assert.match(s,/offline/i,name);
  assert.match(s,/Heartbeat/,name);
 }
 const episode=JSON.parse(read('brain/learning/2026-11-12-installable-app-and-tablet-original-ux-v1.json'));
 assert.equal(episode.fingerprint,guard);
 assert.ok(episode.compiler.failure_class);
 for(const k of ['historical_replay','shadow','canary'])assert.ok(episode.evaluation[k].includes('tests/brain-installable-app-safe-private-20261112.test.mjs'),k);
});
