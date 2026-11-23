import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const app=read('portal-v2/app.js');
const accounting=read('portal-v2/modules/management-accounting-intelligence.js');
const foresight=read('portal-v2/foresight-context-ui.js');
const skill=read('.agents/skills/portal-living-interface/SKILL.md');

test('the original entrepreneur disclosure retains all technical panels without deleting data',()=>{
 const body=app.split('function mountOverviewDepthDisclosure(){')[1]?.split('// One route authority:')[0]||'';
 assert.ok(body);
 for(const selector of [
  '.daily-steering','.dashboard',
  '[data-management-accounting-intelligence]','[data-foresight-context]',
  '[data-pfs-host]','[data-contextual-impact-cards]'
 ])assert.ok(body.includes(selector),'missing original panel '+selector);
 assert.match(body,/document\.createElement\('details'\)/);
 assert.match(body,/for\(const section of existing\)body\.appendChild\(section\)/);
 assert.match(body,/details\.open=false/);
 assert.match(body,/subscribePortalRoute\(sync\)/);
});

test('late accounting updates remain inside the existing details, never cloned on the home',()=>{
 assert.match(accounting,/const overviewDepth=main\.querySelector\('\[data-portal-overview-depth\] \.portal-overview-depth-content'\)\|\|main/);
 assert.match(accounting,/if\(!overviewDepth\.contains\(replacement\)\)overviewDepth\.appendChild\(replacement\)/);
 assert.match(accounting,/section\.replaceWith\(replacement\)/);
 assert.match(accounting,/overviewDepth\.appendChild\(section\)/);
 assert.doesNotMatch(accounting,/localStorage|sessionStorage/);
});

test('Foresight, original scenario and action candidates reuse one overview details host',()=>{
 assert.match(foresight,/const overviewDepth=main\.querySelector\('\[data-portal-overview-depth\] \.portal-overview-depth-content'\)\|\|main/);
 assert.match(foresight,/mountContextualActionCandidates\(overviewDepth,'overzicht',openPage\)/);
 assert.match(foresight,/mountForesightScenarioStudio\(overviewDepth,\{state,pageId:'overzicht',openPage\}\)/);
 assert.match(foresight,/if\(anchor\?\.parentNode===overviewDepth\)anchor\.after\(section\);else overviewDepth\.appendChild\(section\)/);
 assert.match(foresight,/main\.__contextualActionAbort\?\.abort\(\)/);
 assert.doesNotMatch(foresight,/localStorage|sessionStorage/);
});

test('original quality gates continue to require independent human evidence',()=>{
 assert.match(skill,/WCAG 2\.2 AA/);
 assert.match(skill,/90% unaided tasks/);
 assert.match(skill,/200% zoom/);
 assert.match(skill,/no fake demo KPI|No zero substitution/i);
});
