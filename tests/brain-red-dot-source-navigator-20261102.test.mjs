import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sourceNavigatorSnapshot,sourceNavigatorExplanation,mountAwardSourceNavigator} from '../portal-v2/red-dot-source-navigator.js';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('configuration, activation, and permission cannot prove imported customer KPI',()=>{
 const records=[
  {state:'Active',dataUse:{mode:'PORTAL_AI'},name:'<svg onload=alert(1)>',runtime:{token:'SECRETX'}},
  {state:'Draft',dataUse:{mode:'PORTAL_INSIGHTS'},amount:12345},
  {state:'Active',dataUse:{mode:'CONNECTION_ONLY'}}
 ];
 const m=sourceNavigatorSnapshot(records);
 assert.deepEqual(m,{available:true,configured:3,activated:2,insightsRequested:2,aiRequested:1,actualRecordsVerified:false});
 assert.doesNotMatch(JSON.stringify(m),/SECRETX|12345|svg/);
 assert.match(sourceNavigatorExplanation('allow',m),/aangevraagd/);
 assert.match(sourceNavigatorExplanation('verify',m),/geen bewijs|geen bewijs van/i);
 assert.match(sourceNavigatorExplanation('understand',m),/fictieve cijfers/i);
});

test('missing tenant readback must not become zero or green, or expose credentials',async()=>{
 const missing=sourceNavigatorSnapshot(null,{available:false});
 assert.equal(missing.configured,null);
 assert.equal(missing.activated,null);
 assert.equal(missing.actualRecordsVerified,false);
 assert.match(sourceNavigatorExplanation('choose',missing),/niet bevestigen/);
 assert.equal(await mountAwardSourceNavigator(null),null);
});

test('the only UI integration uses original Portal V2 connector route with accessible inspection',()=>{
 const js=read('portal-v2/red-dot-source-navigator.js');
 const shell=read('portal-v2/page-shell.js');
 const css=read('portal-v2/connected-data-sources.css');
 assert.match(js, /\/api\/connectors'/);
 assert.match(js, /credentials:'same-origin'/);
 assert.match(js, /cache:'no-store'/);
 assert.match(js, /aria-pressed/);
 assert.match(js, /aria-live/);
 assert.match(js, /\.textContent/);
 assert.doesNotMatch(js, /\.innerHTML\s*=/);
 assert.doesNotMatch(js, /localStorage|service_role|SUPABASE_SERVICE_ROLE/);
 assert.match(js, /https:\/\/www\.bedrijfsgeheugen\.nl\/portal-v2\/\?page=data-ai-passport/);
 assert.match(shell, /mountAwardSourceNavigator\(native\)/);
 assert.match(css, /bg-award-nav__stage/);
 assert.match(css, /focus-visible/);
 assert.match(css, /prefers-reduced-motion:reduce/);
 assert.match(css, /max-width:450px/);
});

test('no UI mock may claim Red Dot approval or real customer import',()=>{
 for(const stage of ['choose','allow','verify','understand']){
  const t=sourceNavigatorExplanation(stage,sourceNavigatorSnapshot([]));
  assert.ok(t.length>40);
  assert.doesNotMatch(t,/bekroond|award gewonnen|reeds gesynchroniseerd|€[0-9]/i);
 }
});
