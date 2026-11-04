import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('original Portal V2 full-menu dismissal preserves last content route',async()=>{
 const app=await read('portal-v2/app.js');
 assert.match(app,/let hubReturnTarget='overzicht'/);
 assert.match(app,/subscribePortalRoute\(\(\{target\}\)=>\{/);
 assert.match(app,/if\(target&&!target\.startsWith\('hub:'\)\)hubReturnTarget=target/);
 assert.match(app,/function dismissHub\(\)/);
 assert.match(app,/navigatePortal\(returnTarget,\{replace:true\}\)/);
 assert.doesNotMatch(app,/closeHub\(\);navigatePortal\('overzicht',\{replace:true\}\)/);
});

test('mobile dialog is truly modal and returns keyboard focus to its visible invoker',async()=>{
 const [app,html]=await Promise.all([read('portal-v2/app.js'),read('portal-v2/index.html')]);
 assert.match(html,/id="allPages" role="dialog" aria-modal="true"/);
 assert.match(html,/id="closePages" aria-label="Sluiten"/);
 assert.match(app,/background\.inert=true/);
 assert.match(app,/background\.inert=false/);
 assert.match(app,/el\('closePages'\)\?\.focus\(\{preventScroll:true\}\)/);
 assert.match(app,/syncHubTriggerState\(true\)/);
 assert.match(app,/syncHubTriggerState\(false\)/);
 assert.match(app,/if\(e\.key==='Escape'\)\{e\.preventDefault\(\);dismissHub\(\);return;\}/);
 assert.match(app,/if\(e\.key!=='Tab'\)return/);
 assert.match(app,/if\(e\.shiftKey&&\(active===first\|\|!sheet\.contains\(active\)\)\)/);
 assert.match(app,/else if\(!e\.shiftKey&&\(active===last\|\|!sheet\.contains\(active\)\)\)/);
 assert.match(app,/target\.focus\(\{preventScroll:true\}\)/);
});

test('the original hydrated mobile Playwright is the independent runtime acceptance test',async()=>{
 const mobile=await read('tests/integration/portal-v2-mobile-shell.spec.js');
 assert.match(mobile,/toHaveJSProperty\('inert',true\)/);
 assert.match(mobile,/toHaveJSProperty\('inert',false\)/);
 assert.match(mobile,/toBeFocused\(\)/);
 assert.match(mobile,/press\('Shift\+Tab'\)/);
 assert.match(mobile,/press\('Escape'\)/);
 assert.match(mobile,/toHaveURL\(previousUrl\)/);
 assert.match(mobile,/toHaveAttribute\('aria-expanded','true'\)/);
});
