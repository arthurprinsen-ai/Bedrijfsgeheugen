import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import {waitForPortalAppBoot} from '../tools/site-shell/verify-targeted-website-routes.mjs';

const portal=readFileSync(new URL('../portal-v2/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../portal-v2/app.js',import.meta.url),'utf8');
const watchdog=readFileSync(new URL('../portal-v2/portal-boot-watchdog.js',import.meta.url),'utf8');
const verifier=readFileSync(new URL('../tools/site-shell/verify-targeted-website-routes.mjs',import.meta.url),'utf8');
const visual=readFileSync(new URL('../tools/site-shell/ui-visual-regression/browser-check.mjs',import.meta.url),'utf8');

function createHarness(){
  const nodes=new Map();
  const timers=[];
  let reloads=0;
  const root={dataset:{},classList:{contains:()=>true}};
  const newElement=tag=>({
    tagName:tag.toUpperCase(),
    children:[],
    handlers:{},
    textContent:'',
    append(...elements){this.children.push(...elements)},
    setAttribute(name,value){(this.attrs??={})[name]=value},
    addEventListener(name,handler){this.handlers[name]=handler},
    remove(){nodes.delete(this.id)}
  });
  const document={
    readyState:'complete',
    documentElement:root,
    createElement:newElement,
    getElementById:id=>nodes.get(id)||null,
    body:{appendChild(el){nodes.set(el.id,el)}}
  };
  const sandbox={document,location:{reload:()=>reloads++},setTimeout:(fn,ms)=>{timers.push({fn,ms});return 1}};
  runInNewContext(watchdog,sandbox);
  return {root,document,timers,sandbox,nodes,get reloads(){return reloads}};
}
test('portal boot guard is parser-first, and source-only independent watchdog is deferred before main shell',()=>{
  const head=portal.slice(0,portal.indexOf('</head>'));
  assert.match(head,/id="portalBoot"/);
  assert.match(head,/id="portalBootRecovery"/);
  assert.match(head,/<script defer src="\.\/portal-boot-watchdog\.js"><\/script>/);
  assert.ok(head.indexOf('portal-boot-watchdog.js')<head.indexOf('rel="stylesheet"'),'watchdog setup must not wait for full module graph');
  assert.match(head,/html\[data-bg-portal-boot-state="failed"\] body>\.app\{visibility:hidden!important/);
  assert.match(head,/html\[data-bg-portal-boot-state="failed"\] body>#portalStartupFailure\{visibility:visible!important/);
  assert.match(app,/document\.documentElement\.dataset\.bgPortalAppBoot='ready'/);
  assert.match(app,/globalThis\.__bgMarkPortalBootReady\?\.\(\)/);
});
test('failed module graph shows readable retry and does not expose private/static sample shell',()=>{
  const h=createHarness();
  assert.equal(h.timers.length,1);
  assert.equal(h.timers[0].ms,15000);
  assert.equal(h.nodes.size,0);
  h.timers[0].fn();
  assert.equal(h.root.dataset.bgPortalBootState,'failed');
  const panel=h.document.getElementById('portalStartupFailure');
  assert.equal(panel.attrs.role,'alert');
  assert.match(panel.children[0].textContent,/niet volledig starten/);
  assert.match(panel.children[1].textContent,/Je gegevens zijn niet gewijzigd/);
  panel.children[2].handlers.click();
  assert.equal(h.reloads,1);
  h.sandbox.__bgMarkPortalBootReady();
  assert.equal(h.root.dataset.bgPortalBootState,undefined);
  assert.equal(h.root.dataset.bgPortalAppBoot,'ready');
  assert.equal(h.document.getElementById('portalStartupFailure'),null);
});
test('a mounted portal never produces a false error on elapsed timeout',()=>{
  const h=createHarness();
  h.sandbox.__bgMarkPortalBootReady();
  h.timers[0].fn();
  assert.equal(h.nodes.size,0);
  assert.equal(h.root.dataset.bgPortalBootState,undefined);
});
test('portal route verifier waits for genuine mounted shell, rejects hidden and error-only screens',async()=>{
  const prior=globalThis.document;
  const root={dataset:{},classList:{contains:()=>true}};
  let errorPanel=null;
  globalThis.document={documentElement:root,getElementById:()=>errorPanel};
  const observed=[];
  const page={waitForFunction:async(fn,arg,opts)=>{observed.push({arg,opts});return fn()}};
  try{
    assert.equal(await waitForPortalAppBoot(page,{timeout:25000}),false,'initial loading screen not ready');
    root.dataset.bgPortalAppBoot='ready';
    root.classList.contains=()=>false;
    assert.equal(await waitForPortalAppBoot(page,{timeout:25000}),true);
    root.dataset.bgPortalBootState='failed';
    assert.equal(await waitForPortalAppBoot(page,{timeout:25000}),false);
    delete root.dataset.bgPortalBootState;errorPanel={id:'portalStartupFailure'};
    assert.equal(await waitForPortalAppBoot(page,{timeout:25000}),false);
    assert.deepEqual(observed.map(x=>x.arg),[undefined,undefined,undefined,undefined]);
    assert.deepEqual(observed.map(x=>x.opts.timeout),[25000,25000,25000,25000]);
    await assert.rejects(()=>waitForPortalAppBoot(page,{timeout:31000}),/PORTAL_BOOT_READBACK_TIMEOUT_INVALID/);
  }finally{globalThis.document=prior;}
});
test('original production verifier retains fail closed and only public diagnostic fields; CLS cannot be silently waived',()=>{
  assert.match(verifier,/PORTAL_BOOT_READBACK_DIAGNOSTIC/);
  assert.match(verifier,/await waitForPortalAppBoot\(page,\{timeout:25_000\}\)/);
  assert.match(verifier,/page_error_count:observedPageErrors\.length/);
  assert.match(verifier,/failed_asset_count:failedAssets\.length/);
  assert.match(visual,/UI_VISUAL_CLS_DIAGNOSTIC/);
  assert.match(visual,/PUBLIC_VISUAL_CLS_FAILURE_EVIDENCE_V1/);
  assert.match(visual,/if \(sample\.cls\.value > registry\.defaults\.clsMax\)/);
  assert.match(visual,/throw error/);
});
