import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../portal-v2/',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');

test('root-cause replay: new entrepreneur home leads with one actionable next step before technical context',async()=>{
 const ui=await read('entrepreneur-home.js');
 const next=ui.indexOf("const next=add(host,'article','eh-next eh-focus')");
 const details=ui.indexOf("const advanced=add(host,'details','eh-advanced')");
 const attention=ui.indexOf("attention.dataset.entrepreneurAttention='v1'");
 assert.ok(next>0&&details>next&&attention>details);
 assert.match(ui,/const summary=add\(advanced,'summary','eh-advanced-summary'\)/);
 assert.match(ui,/if\(!model\.selectedGoal\)host\.insertBefore\(chooser,advanced\)/);
 assert.match(ui,/saveEntrepreneurGoal\(domainState,goalId,\{authenticated:true\}\)/);
});

test('shadow: mobile bottom navigation reuses only the canonical permission-aware router',async()=>{
 const [app,route,css]=await Promise.all([read('app.js'),read('router.js'),read('navigation.css')]);
 for(const id of ['overzicht','actieve-acties','outcomes-evidence','hub:portal']){
  assert.ok(app.includes("['"+id+"'"),id);
 }
 assert.match(app,/button\.addEventListener\('click',\(\)=>navigatePortal\(target\)\)/);
 assert.match(app,/subscribePortalRoute\(sync\)/);
 assert.match(route,/button\.closest\('details\.portal-single-nav-group'\)/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/safe-area-inset-bottom/);
});

test('canary preparation: hidden depth does not hide evidence or fabricate customer results',async()=>{
 const [ui,style,registry]=await Promise.all([read('entrepreneur-home.js'),read('entrepreneur-home.css'),read('page-registry.js')]);
 assert.match(ui,/stateClient\.getSnapshot\(\)\?\.state/);
 assert.match(ui,/Voorbeeldcijfers en voorspellingen tellen nooit mee/);
 assert.match(ui,/Nog geen onafhankelijk bewezen financieel resultaat/);
 assert.match(ui,/renderEntrepreneurJourney\(host,journey\)/);
 assert.match(style,/eh-advanced-summary:focus-visible/);
 assert.match(style,/prefers-reduced-motion/);
 assert.match(registry,/export const PORTAL_SECTIONS/);
 assert.doesNotMatch(ui,/localStorage|sessionStorage|Math\.random/);
});

test('old five-stage and processor panels remain reachable but are collapsed behind native depth disclosure',async()=>{
 const [app,html,style]=await Promise.all([read('app.js'),read('index.html'),read('navigation.css')]);
 assert.match(app,/function mountOverviewDepthDisclosure\(\)/);
 assert.match(app,/document\.createElement\('details'\)/);
 assert.match(app,/details\.dataset\.portalOverviewDepth='v1'/);
 assert.match(app,/\['\.daily-steering','\.kpis','\.dashboard','\.lower','\.activities'\]/);
 assert.match(app,/for\(const section of existing\)body\.appendChild\(section\)/);
 assert.match(app,/mountOverviewDepthDisclosure\(\);/);
 assert.match(style,/\.portal-overview-depth\[hidden\]\{display:none!important\}/);
 assert.match(style,/\.portal-overview-depth-trigger:focus-visible/);
 assert.match(html,/class="daily-steering"/);
 assert.match(html,/class="dashboard"/);
});
