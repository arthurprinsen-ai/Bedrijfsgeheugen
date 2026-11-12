import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const manifest=JSON.parse(read('app.webmanifest'));

test('one installable company app, public site and Portal V2 use one identity and real original icon',()=>{
 assert.equal(manifest.id,'/bedrijfsgeheugen-app');
 assert.equal(manifest.scope,'/');
 assert.equal(manifest.start_url,'/portal-v2/');
 assert.equal(manifest.display,'standalone');
 assert.equal(manifest.lang,'nl-NL');
 assert.ok(manifest.shortcuts.some(s=>s.url==='/portal-v2/'));
 assert.ok(manifest.shortcuts.some(s=>s.url==='/zelfscan'));
 for(const icon of manifest.icons){
  assert.ok(icon.src.startsWith('/assets/merk/'));
  assert.ok(existsSync(new URL('../'+icon.src.slice(1),import.meta.url)));
  assert.equal(icon.type,'image/png');
 }
 const portal=read('portal-v2/index.html');
 const publicBuilder=read('tools/site-shell/apply-cms-runtime.mjs');
 assert.match(portal,/rel="manifest" href="https:\/\/www\.bedrijfsgeheugen\.nl\/app\.webmanifest"/);
 assert.match(portal,/apple-mobile-web-app-capable/);
 assert.match(portal,/viewport-fit=cover/);
 assert.match(publicBuilder,/data-bg-app-manifest/);
 assert.match(publicBuilder,/data-bg-app-experience/);
 assert.match(portal,/grip-native\.css\?v=20261112/);
});

test('app install and branded public GripDock are real tasks, not a second menu or fabricated data store',()=>{
 const js=read('assets/grip-app-experience.js');
 const css=read('assets/grip-app-ui.css');
 assert.doesNotThrow(()=>new Function(js));
 assert.match(js,/beforeinstallprompt/);
 assert.match(js,/navigator\.serviceWorker\.register/);
 assert.match(js,/new URL\(route,SITE_ROOT\)\.href/);
 assert.match(js,/dock\.dataset\.bgGripdock='v1'/);
 assert.match(js,/\{route:'\/portal-v2\/',label:'Mijn grip'/);
 assert.match(js,/\{route:'\/zelfscan',label:'Scan'/);
 assert.match(js,/install\.addEventListener\('click',tryInstall\)/);
 assert.match(js,/event\.preventDefault\(\)/);
 assert.doesNotMatch(js,/innerHTML\s*=|localStorage|sessionStorage|setInterval|caches\.put\(|fetch\(/);
 assert.match(css,/@media\(max-width:1180px\)/);
 assert.match(css, /env\(safe-area-inset-bottom/);
 assert.match(css, /body\.bg-site-mobile-menu-open > \.bg-gripdock/);
 assert.match(css, /focus-visible/);
 assert.match(css, /prefers-reduced-motion/);
});

test('existing single original Portal V2 task dock extends to tablet, with native keyboard and safe-area geometry',()=>{
 const css=read('portal-v2/grip-native.css');
 const nav=read('portal-v2/navigation.css');
 const app=read('portal-v2/app.js');
 assert.match(css,/@media\(max-width:1180px\)/);
 assert.match(css,/@media\(min-width:761px\) and \(max-width:1180px\)/);
 assert.match(css,/\.portal-mobile-primary\{/);
 assert.match(css, /body:has\(\.portal-mobile-primary\)/);
 assert.match(css,/env\(safe-area-inset-bottom/);
 assert.match(css,/touch-action:manipulation/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/portal-hamburger\{display:none!important\}/);
 assert.match(nav,/portal-mobile-primary/);
 assert.match(app,/mountMobilePrimaryNavigation\(\)/);
 assert.match(app,/button\.addEventListener\('click',\(\)=>navigatePortal\(target\)\)/);
 assert.equal((app.match(/function mountMobilePrimaryNavigation\(\)/g)||[]).length,1);
 assert.doesNotMatch(css,/pointer-events:none!important;.*portal-mobile-primary/);
});

test('private source, tenant route and provider data are never stored by the service worker',async()=>{
 const code=read('service-worker.js');
 assert.doesNotThrow(()=>new Function(code));
 assert.doesNotMatch(code,/cache\.put\(|caches\.match\(request\)|caches\.addAll\(|localStorage|sessionStorage/);
 const listeners={};
 const stored=[];
 const offlineResponse={offline:true};
 const cache={
  add:async url=>{stored.push(url);},
  match:async url=>url==='/offline.html'?offlineResponse:null
 };
 let failed=false;
 const context={
  self:{
   location:{origin:'https://www.bedrijfsgeheugen.nl'},
   addEventListener:(event,cb)=>{listeners[event]=cb;},
   skipWaiting:()=>Promise.resolve(),
   clients:{claim:()=>Promise.resolve()}
  },
  caches:{open:async()=>cache,keys:async()=>['bg-offline-20261001-v1','other-app-cache'],delete:async()=>true},
  fetch:async req=>{if(failed)throw Error('NETWORK_UNAVAILABLE');return {network:true,url:req.url};},
  Response:{error:()=>({error:true})},
  URL,
  Promise
 };
 vm.runInNewContext(code,context);
 let install;
 listeners.install({waitUntil:promise=>install=promise});
 await install;
 assert.deepEqual(stored,['/offline.html']);
 let navigation;
 failed=true;
 listeners.fetch({request:{mode:'navigate',method:'GET',url:'https://www.bedrijfsgeheugen.nl/portal-v2/'},respondWith:promise=>navigation=promise});
 assert.equal((await navigation).offline,true);
 let intercepted=false;
 listeners.fetch({request:{mode:'cors',method:'GET',url:'https://www.bedrijfsgeheugen.nl/api/portal-state'},respondWith:()=>{intercepted=true;}});
 listeners.fetch({request:{mode:'navigate',method:'POST',url:'https://www.bedrijfsgeheugen.nl/portal-v2/'},respondWith:()=>{intercepted=true;}});
 assert.equal(intercepted,false);
 assert.deepEqual(stored,['/offline.html']);
 assert.match(read('offline.html'),/niet offline gekopieerd/);
});

test('governance remains the original website and Portal V2, not a new executor or order source',()=>{
 const skill=read('.agents/skills/portal-living-interface/SKILL.md');
 const agents=read('platform/agents/agent-team.mjs');
 const global=read('AGENTS.md');
 const fingerprint='site-portal|ux-pwa|gripdock-single-app-responsive-original-loop|20261112-v1';
 assert.match(skill,/site-portal\|ux-pwa\|gripdock-single-app-responsive-original-loop\|20261112-v1/);
 assert.match(global,/site-portal\|ux-pwa\|gripdock-single-app-responsive-original-loop\|20261112-v1/);
 assert.match(agents,/verify-original-gripdock-pwa-tablet-touch-and-private-offline-fallback-without-parallel-router/);
 assert.equal(fingerprint.length>30,true);
 const pwa=read('assets/grip-app-experience.js');
 const sw=read('service-worker.js');
 for(const file of [pwa,sw])assert.doesNotMatch(file,/fetch\(.+\{method:\s*['"]POST|\.insert\(|\.upsert\(|setInterval\(/);
});
