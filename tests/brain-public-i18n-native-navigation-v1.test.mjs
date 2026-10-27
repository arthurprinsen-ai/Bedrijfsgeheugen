import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('public locale anchors own navigation and mobile mount is parent-safe', async () => {
  const runtime = await readFile('assets/js/i18n.js','utf8');
  assert.match(runtime,/!isPortal\(\) && option\.tagName === 'A'/);
  assert.match(runtime,/event\.stopImmediatePropagation\(\)/);
  assert.match(runtime,/window\.location\.assign\(href\)/);
  assert.match(runtime,/node && node\.parentNode === mobileHost/);
});

test('i18n asset version changes with runtime navigation fix', async () => {
  const build = await readFile('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(build,/cms-i18n-20260930-4/);
});

test('capture navigation survives menu teardown and leaves portal switching in place', async()=>{
  const source=await readFile('assets/js/i18n.js','utf8');
  const start=source.indexOf('function bindControlEvents()');
  const end=source.indexOf('function startObserver()',start);
  assert.ok(start>=0&&end>start);
  function harness(portal=false){
    const calls=[];let click;
    const window={addEventListener(type,fn,capture){assert.equal(type,'click');assert.equal(capture,true);click=fn;},location:{assign:href=>calls.push(['navigate',href])}};
    const document={cookie:'',addEventListener(){}};
    new Function('window','document','localStorage','normalizeLocale','SUPPORTED','STORAGE_KEY','isPortal','localizedHref','closeMenus','setLocale','showLocaleError','let controlsBound=false;'+source.slice(start,end)+';bindControlEvents();')(
      window,document,{setItem:(key,value)=>calls.push(['persist',value])},x=>x,new Set(['nl','en']),'bg_locale',()=>portal,x=>'/'+x+'/route',()=>calls.push(['close']),x=>{calls.push(['portal',x]);return Promise.resolve();},()=>{});
    return {calls,document,dispatch(option){click({target:{closest:()=>option},preventDefault:()=>calls.push(['prevent']),stopImmediatePropagation:()=>calls.push(['stop'])});}};
  }
  const option=(locale,href)=>({dataset:{bgLanguageOption:locale},tagName:'A',getAttribute:()=>href,setAttribute:(key,value)=>{href=value;}});
  for(const [locale,href] of [['en','/en/prijzen?proof=1#saas'],['nl','/prijzen?proof=1#saas']]){
    const h=harness();h.dispatch(option(locale,href));
    assert.deepEqual(h.calls,[['stop'],['persist',locale],['prevent'],['close'],['navigate',href]]);
    assert.ok(h.document.cookie.includes('bg_locale='+locale));
  }
  const none=harness();none.dispatch(null);none.dispatch(option('de','/de/'));assert.deepEqual(none.calls,[]);
  const portal=harness(true);portal.dispatch(option('en','/en/route'));assert.deepEqual(portal.calls,[['stop'],['persist','en'],['prevent'],['portal','en']]);
  const fallback=harness();fallback.dispatch(option('en',''));assert.deepEqual(fallback.calls.at(-1),['navigate','/en/route']);
});
