import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {mountPortalAppInstall} from '../portal-v2/install-app.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const fingerprint='portal|app|one-installable-phone-tablet-shell|20261112-v1';

test('historical: same original site and portal install to one standalone customer app, with proper icon files',()=>{
 const m=JSON.parse(read('app.webmanifest'));
 assert.equal(m.id,'https://www.bedrijfsgeheugen.nl/portal-v2/');
 assert.equal(m.start_url,'https://www.bedrijfsgeheugen.nl/portal-v2/');
 assert.equal(m.scope,'https://www.bedrijfsgeheugen.nl/');
 assert.equal(m.display,'standalone');
 assert.ok(m.icons.some(x=>x.sizes==='192x192'&&x.src.endsWith('/app-icon-192.png')));
 assert.ok(m.icons.some(x=>x.sizes==='512x512'&&x.src.endsWith('/icon-512.png')));
 assert.ok(m.shortcuts.some(x=>x.url.includes('?page=actieve-acties')));
 assert.ok(m.shortcuts.some(x=>x.url.includes('?page=outcomes-evidence')));
 for(const item of m.icons)assert.ok(item.src.startsWith('https://www.bedrijfsgeheugen.nl/'));
 const icon=readFileSync(new URL('../assets/merk/app-icon-192.png',import.meta.url));
 assert.equal(icon.subarray(1,4).toString('ascii'),'PNG');
 assert.equal(icon.readUInt32BE(16),192);assert.equal(icon.readUInt32BE(20),192);
 assert.ok(existsSync(new URL('../assets/merk/icon-512.png',import.meta.url)));
});

test('shadow: full URL manifest links on both original entrypoints, one original public page builder for all routes',()=>{
 const home=read('index.html'),portal=read('portal-v2/index.html'),builder=read('tools/site-shell/apply-cms-runtime.mjs');
 for(const html of [home,portal]){
  assert.match(html,/<link rel="manifest" href="https:\/\/www\.bedrijfsgeheugen\.nl\/app\.webmanifest">/);
 }
 assert.match(portal,/viewport-fit=cover/);
 assert.match(portal,/apple-mobile-web-app-title/);
 assert.match(portal,/install-app\.js\?v=20261112/);
 assert.match(portal,/app-feel\.css\?v=20261112/);
 assert.match(builder,/publicPage=!/);
 assert.match(builder,/data-bg-app-manifest/);
 assert.match(builder,/https:\/\/www\.bedrijfsgeheugen\.nl\/app\.webmanifest/);
});

test('canary: reuse original four-tab dock on tablets, no parallel navigation, keyboard/touch and full-site form fit',()=>{
 const css=read('portal-v2/app-feel.css');
 const nav=read('portal-v2/navigation.css');
 const app=read('portal-v2/app.js');
 const site=read('assets/sitewide-mobile-ui-20261111.css');
 assert.match(css,/min-width:761px\) and \(max-width:1024px/);
 assert.match(css,/\.app>\.sidebar\{display:none!important\}/);
 assert.match(css,/\.portal-mobile-primary\{display:grid!important/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/display-mode:standalone/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/focus-visible/);
 assert.match(app,/function mountMobilePrimaryNavigation\(\)/);
 assert.match(nav,/\.portal-mobile-primary\{display:none\}/);
 assert.match(site,/font-size:16px/);
 assert.match(site,/min-height:44px/);
 assert.match(site,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(css,/display:none!important.*data-bg-portal/);
});

test('OS install prompt requires real user click; iOS gets instructions instead of false installed status',async()=>{
 const listeners=new Map(),winEvents=new Map();
 const make=()=>{
  const attrs={};return {
   hidden:false,dataset:{},listeners:new Map(),remove(){this.removed=true},
   setAttribute(k,v){attrs[k]=v},addEventListener(k,cb){this.listeners.set(k,cb)},
   removeEventListener(k){this.listeners.delete(k)},get attrs(){return attrs}
  };
 };
 const links={button:null,status:null,querySelector(){return null},append(item){this.button=item},after(item){this.status=item}};
 const panel={querySelector(selector){return selector==='.portal-popover-links'?links:null}};
 const doc={getElementById(id){return id==='portalHelpPanel'?panel:null},createElement:make};
 const win={navigator:{userAgent:'iPhone'},matchMedia(){return {matches:false}},
  addEventListener(k,cb){winEvents.set(k,cb)},removeEventListener(k){winEvents.delete(k)}};
 const installed=mountPortalAppInstall({documentRef:doc,windowRef:win});
 assert.ok(installed);assert.equal(installed.element.hidden,false);
 await installed.element.listeners.get('click')();
 assert.match(links.status.textContent,/Safari/);
 assert.equal(links.status.hidden,false);
 // When the OS reports installation, the visible CTA disappears.
 winEvents.get('appinstalled')();
 assert.equal(installed.element.hidden,true);
 installed.destroy();
 assert.equal(installed.element.removed,true);
});

test('no private offline caching, no fake install and original agents+skill inherit production proof gate',()=>{
 const install=read('portal-v2/install-app.js'),skill=read('.agents/skills/portal-living-interface/SKILL.md');
 const agents=read('platform/agents/agent-team.mjs'),docs=read('AGENTS.md');
 assert.match(install,/beforeinstallprompt/);
 assert.match(install,/appinstalled/);
 assert.match(install,/prompt\.userChoice/);
 assert.match(install,/status\.setAttribute\('aria-live','polite'\)/);
 assert.match(skill,new RegExp(fingerprint.replace(/[|]/g,'\\|')));
 assert.match(docs,new RegExp(fingerprint.replace(/[|]/g,'\\|')));
 assert.match(agents,/verify-single-installable-portal-app-and-tablet-original-dock-with-current-readback/);
 for(const code of [install,read('portal-v2/app-feel.css')])
  assert.doesNotMatch(code,/serviceWorker\.register|caches\.open|localStorage|sessionStorage|setInterval\(/);
});
