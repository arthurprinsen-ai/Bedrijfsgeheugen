import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=name=>readFile(new URL('../'+name,import.meta.url),'utf8');

test('customer home renders a single prominent next action before advanced details',async()=>{
 const ui=await read('entrepreneur-home.js');
 assert.match(ui,/eh-next eh-focus/);
 assert.match(ui,/const advanced=add\(host,'details','eh-advanced'\)/);
 assert.match(ui,/add\(advanced,'summary','eh-advanced-summary'\)/);
 assert.ok(ui.indexOf("const next=add(host,'article','eh-next eh-focus')")<ui.indexOf("const advanced=add(host,'details','eh-advanced')"));
 assert.ok(ui.indexOf("const advanced=add(host,'details','eh-advanced')")<ui.indexOf("attention.dataset.entrepreneurAttention='v1'"));
 assert.equal((ui.match(/const journey=buildEntrepreneurJourneyModel\(customerState/g)||[]).length,1);
 assert.match(ui,/renderEntrepreneurJourney\(host,journey\)/);
 assert.match(ui,/advanced\.appendChild\(journeySection\)/);
});

test('goal choice remains directly available before advanced content on the first visit',async()=>{
 const ui=await read('entrepreneur-home.js');
 assert.match(ui,/if\(!model\.selectedGoal\)host\.insertBefore\(chooser,advanced\)/);
 assert.match(ui,/button\.dataset\.entrepreneurReveal==='true'/);
 assert.match(ui,/goals\?\.parentElement===host/);
 assert.match(ui,/saveEntrepreneurGoal\(domainState,goalId,\{authenticated:true\}\)/);
 assert.match(ui,/stateClient\.getSnapshot\(\)\?\.state/);
 assert.match(ui,/domainState\.initialized\?\.\(\)/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage/);
});

test('mobile dock routes only to original authorized router and hides behind full menu',async()=>{
 const [app,router,css]=await Promise.all([read('app.js'),read('router.js'),read('navigation.css')]);
 for(const target of ["['overzicht'","['actieve-acties'","['outcomes-evidence'","['hub:portal'"])assert.ok(app.includes(target),target);
 assert.match(app,/button\.addEventListener\('click',\(\)=>navigatePortal\(target\)\)/);
 assert.match(app,/subscribePortalRoute\(sync\)/);
 assert.match(css,/portal-mobile-primary/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(css,/body:has\(\.allpages\.open\) \.portal-mobile-primary/);
 assert.match(router,/button\.closest\('details\.portal-single-nav-group'\)/);
 assert.doesNotMatch(app,/new WebSocket|setInterval\(.+navigatePortal/);
});

test('focus controls meet keyboard and motion preferences and preserve visible evidence caveats',async()=>{
 const [css,ui]=await Promise.all([read('entrepreneur-home.css'),read('entrepreneur-home.js')]);
 assert.match(css,/eh-advanced-summary:focus-visible/);
 assert.match(css,/prefers-reduced-motion/);
 assert.match(css,/eh-focus \.eh-main-action/);
 assert.match(ui,/Nog geen onafhankelijk bewezen financieel resultaat/);
 assert.match(ui,/Geen actuele, klantgebonden Powerhouse-projectie bewezen/);
 assert.match(ui,/Voorbeeldcijfers en voorspellingen tellen nooit mee/);
});

test('legacy process and dashboard remain reachable as one optional accessible overview section',async()=>{
 const [app,css,html]=await Promise.all([read('app.js'),read('navigation.css'),read('index.html')]);
 assert.match(app,/function mountOverviewDepthDisclosure\(\)/);
 assert.match(app,/details\.className='portal-overview-depth'/);
 assert.match(app,/summary\.className='portal-overview-depth-trigger'/);
 assert.match(app,/for\(const section of existing\)body\.appendChild\(section\)/);
 assert.match(app,/sync\(\{target:params\.get\('hub'\)/);
 assert.match(app,/if\(details\.open\)requestAnimationFrame\(render\)/);
 assert.match(css,/portal-overview-depth-trigger:focus-visible/);
 assert.match(css,/portal-overview-depth\[hidden\]\{display:none!important\}/);
 assert.match(html,/class="daily-steering"/);
 assert.match(html,/class="dashboard"/);
});
