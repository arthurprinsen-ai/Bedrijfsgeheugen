import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const publicApp=JSON.parse(read('assets/app.webmanifest'));
const portal=JSON.parse(read('portal-v2/app.webmanifest'));
const originalScript=read('assets/sitewide-mobile-ui-20261111.js');
const publicCss=read('assets/sitewide-mobile-ui-20261111.css');
const portalCss=read('portal-v2/app-native.css');
const originalBuilder=read('tools/site-shell/apply-cms-runtime.mjs');
const portalHtml=read('portal-v2/index.html');

test('historical: two standalone web-app identities link to existing real routes with separate scopes',()=>{
 assert.equal(publicApp.display,'standalone');
 assert.equal(portal.display,'standalone');
 assert.notEqual(publicApp.id,portal.id);
 assert.equal(publicApp.start_url,'https://www.bedrijfsgeheugen.nl/');
 assert.equal(portal.start_url,'https://www.bedrijfsgeheugen.nl/portal-v2/');
 assert.equal(portal.scope,'https://www.bedrijfsgeheugen.nl/portal-v2/');
 for(const manifest of [publicApp,portal]){
  assert.equal(manifest.lang,'nl-NL');
  assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512'));
  assert.ok(manifest.shortcuts.every(item=>item.url.startsWith('https://www.bedrijfsgeheugen.nl/')));
  assert.ok(manifest.shortcuts.every(item=>item.url.startsWith(manifest.scope)));
 }
});

test('shadow: public app dock uses actual canonical destinations, no new menu or client-data store',()=>{
 assert.doesNotThrow(()=>new Function(originalScript));
 assert.match(originalScript,/data\.bgPublicAppDock='v1'/);
 assert.match(originalScript,/document\.querySelector\('\[data-bg-public-app-dock\]'\)/);
 assert.match(originalScript,/\/portal-v2\//);
 assert.match(originalScript,/https:\/\/www\.bedrijfsgeheugen\.nl/);
 assert.match(originalScript,/document\.body\.appendChild\(dock\)/);
 assert.match(originalScript,/ensureCloseButtons\(\)/);
 assert.match(originalScript,/ensurePublicAppDock\(\)/);
 assert.doesNotMatch(originalScript,/navigator\.serviceWorker|caches\.open|new Worker\(|setInterval\(/);
 assert.match(publicCss,/@media\(max-width:1024px\)/);
 assert.match(publicCss,/safe-area-inset-bottom/);
 assert.match(publicCss, /bg-site-mobile-menu-open \.bg-mobile-app-dock/);
 assert.match(publicCss,/focus-visible/);
 assert.match(publicCss,/prefers-reduced-motion/);
});

test('canary: exactly one original public build injects full-URL web-app head metadata',()=>{
 assert.match(originalBuilder,/data-bg-app-manifest="public-v1"/);
 assert.match(originalBuilder,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/app\.webmanifest"/);
 assert.match(originalBuilder,/const styleStart=html\.indexOf/);
 assert.match(originalBuilder,/const scriptMarker=html\.indexOf/);
 assert.match(originalBuilder,/20261112app/);
 assert.match(originalBuilder,/publicPage=!/);
 assert.match(originalBuilder,/portal-v2/);
 assert.match(portalHtml,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\/app\.webmanifest"/);
 assert.match(portalHtml,/href="https:\/\/www\.bedrijfsgeheugen\.nl\/apple-touch-icon\.png"/);
 assert.match(portalHtml,/app-native\.css\?v=20261112/);
});

test('tablet reuses the one original protected Portal V2 mobile router instead of replacing business sources',()=>{
 const app=read('portal-v2/app.js');
 assert.match(app,/nav\.dataset\.portalMobilePrimary='v1'/);
 assert.match(app,/button\.addEventListener\('click',\(\)=>navigatePortal\(target\)\)/);
 assert.match(portalCss,/@media \(min-width:761px\) and \(max-width:1024px\)/);
 assert.match(portalCss,/\.portal-mobile-primary/);
 assert.match(portalCss,/\.sidebar\{display:none!important\}/);
 assert.match(portalCss,/body:has\(\.allpages\.open\) \.portal-mobile-primary/);
 assert.match(portalCss,/focus-visible/);
 assert.match(portalCss,/safe-area-inset-bottom/);
 assert.doesNotMatch(portalCss,/display:none.*\.app/);
});

test('agent/skill and original browser/test owners protect scope, accessibility and honest installability',()=>{
 const agent=read('platform/agents/agent-team.mjs');
 const website=read('skills/website-portal-coherence.md');
 const portalSkill=read('.agents/skills/portal-living-interface/SKILL.md');
 const global=read('AGENTS.md');
 const fingerprint='website|portal|standalone-app-native-phone-tablet-one-navigation|20261112-v1';
 for(const x of [website,portalSkill,global])assert.ok(x.includes(fingerprint));
 assert.match(agent,/verify-canonical-phone-tablet-app-navigation-and-standalone-manifests-without-private-cache/);
 assert.match(read('tools/site-shell/sitewide-mobile-interaction-browser-check.mjs'),/data-bg-public-app-dock/);
 assert.match(read('tests\/integration\/portal-v2-mobile-shell.spec.js'),/tablet uses the original four-tab protected portal dock/);
});
