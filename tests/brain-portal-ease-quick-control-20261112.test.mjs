import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildDailyControlCards} from '../portal-v2/daily-controls.js';
import {filterPortalQuickSwitchEntries} from '../portal-v2/quick-switcher.js';
import {findPage} from '../portal-v2/page-registry.js';

const src=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const home={authenticated:true,scan:{verified:false}};
const journey={authenticated:true,steps:[
 {id:'scan',confirmed:false},{id:'goal',confirmed:true},{id:'evidence',confirmed:false},
 {id:'decision',confirmed:false},{id:'outcome',confirmed:false}
],brainReceipt:null};

test('historical: public, anonymous, demo and missing tenant context can never show customer controls',()=>{
 assert.deepEqual(buildDailyControlCards({authenticated:false,home,journey}),[]);
 assert.deepEqual(buildDailyControlCards({authenticated:true,home:{authenticated:false},journey}),[]);
 assert.deepEqual(buildDailyControlCards({authenticated:true,home,journey:{authenticated:false}}),[]);
});

test('shadow: four simple control cards show no fake provider/effect result when original evidence is absent',()=>{
 const cards=buildDailyControlCards({authenticated:true,home,journey,pendingHandoff:{pending:true}});
 assert.equal(cards.length,4);
 assert.deepEqual(cards.map(x=>x.id),['gegevens','acties','resultaat','verwerking']);
 assert.deepEqual(cards.map(x=>x.page),['ingevulde-gegevens','actieve-acties','outcomes-evidence','brain-verwerking']);
 for(const c of cards){assert.ok(findPage(c.page),c.page);assert.equal(c.confirmed,false);}
 assert.equal(cards[3].pending,true);
 assert.match(cards[3].status,/nog open/i);
 assert.match(cards[2].status,/geen bewezen effect/i);
 assert.ok(Object.isFrozen(cards));
});

test('canary: exact source-level evidence drives the display, not generic readbacks or invented revenue',()=>{
 const confirmed={...journey,steps:[
  {id:'evidence',confirmed:true},{id:'decision',confirmed:true},{id:'outcome',confirmed:true}
 ],brainReceipt:{acknowledged:true}};
 const cards=buildDailyControlCards({authenticated:true,home,journey:confirmed,pendingHandoff:{pending:false}});
 assert.deepEqual(cards.map(x=>x.confirmed),[true,true,true,true]);
 assert.equal(cards[3].status,'Brain-invoer bevestigd');
 const stillWaiting=buildDailyControlCards({authenticated:true,home,journey:confirmed,pendingHandoff:{pending:true}});
 assert.equal(stillWaiting[3].confirmed,false);
 assert.equal(stillWaiting[3].pending,true);
 const onlyScan=buildDailyControlCards({authenticated:true,home:{...home,scan:{verified:true}},journey});
 assert.equal(onlyScan[0].status,'Nulmeting gekoppeld');
 assert.equal(onlyScan[0].confirmed,false);
});

test('canonical quick search filters original page registry only and respects caller authorizations',()=>{
 const actions=filterPortalQuickSwitchEntries('acties',{allowTarget:id=>id!=='actieve-acties',limit:7});
 assert.equal(actions.some(x=>x.id==='actieve-acties'),false);
 assert.ok(actions.every(x=>findPage(x.target)),JSON.stringify(actions));
 const lookup=filterPortalQuickSwitchEntries('actieve acties');
 assert.ok(lookup.some(x=>x.id==='actieve-acties'));
 const denied=filterPortalQuickSwitchEntries('trust-center',{allowTarget:id=>id!=='trust-center'});
 assert.equal(denied.some(x=>x.id==='trust-center'),false);
 assert.ok(filterPortalQuickSwitchEntries('',{limit:4}).length<=4);
 assert.ok(Object.isFrozen(lookup));
});

test('UX and trust gates stay in original V2, without extra writer, schedule or unsafe HTML',()=>{
 const homeSrc=src('portal-v2/entrepreneur-home.js');
 const search=src('portal-v2/quick-switcher.js');
 const app=src('portal-v2/app.js');
 const style=src('portal-v2/daily-controls.css');
 const index=src('portal-v2/index.html');
 const portalSkill=src('.agents/skills/portal-living-interface/SKILL.md');
 const agents=src('platform/agents/agent-team.mjs');
 assert.match(homeSrc,/renderDailyControls\(host,/);
 assert.match(homeSrc,/renderDecisionWorld\(deeperWorld,/);
 assert.doesNotMatch(homeSrc,/renderDecisionWorld\(next,/);
 assert.match(search,/isProtectedTrustPage\(target\)\|\|hasProtectedTrustAccess\(\)/);
 assert.match(search,/documentRef\.addEventListener\('bg:portal-identity-boundary'/);
 assert.match(search,/subscribePortalRoute\(close\)/);
 assert.match(search,/event\.key==='Escape'/);
 assert.match(search,/event\.key==='ArrowDown'/);
 assert.match(search,/event\.key==='Enter'/);
 assert.match(app,/mountPortalQuickSwitcher\(\{stateClient:portalStateClient\}\)/);
 assert.match(index,/daily-controls\.css\?v=20261112/);
 assert.match(style,/@media\(max-width:760px\)/);
 assert.match(style, /focus-visible/);
 assert.match(style, /prefers-reduced-motion/);
 assert.match(portalSkill,/portal\|ux\|one-home-quick-control-search-original-router\|20261112-v1/);
 assert.match(agents,/verify-calm-evidence-first-portal-home-and-keyboard-canonical-search-with-original-access-gates/);
 for(const source of [search,src('portal-v2/daily-controls.js')]){
  assert.doesNotMatch(source,/new Worker\(|setInterval\(|cron\.schedule|localStorage|sessionStorage|fetch\(/);
  assert.doesNotMatch(source,/innerHTML\s*=/);
 }
});
