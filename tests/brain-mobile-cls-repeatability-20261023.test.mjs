import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {planMobileClsReplay,summarizeMobileClsReplay,MOBILE_CLS_LIMIT} from '../tools/site-shell/mobile-cls-repeatability.mjs';
const config=JSON.parse(readFileSync('config/powerhouse-mobile-cls-repeatability-v1.json','utf8'));
const routes=config.focus_routes;
const make=(plan,cls=0.025)=>plan.modes.flatMap(mode=>plan.routes.flatMap(route=>Array.from({length:plan.rounds},(_,i)=>({mode,route,round:i+1,cls,violations:[]}))));
test('full historical NL/EN CLS routes are sampled at 390x844 under both concurrency modes',()=>{
 const p=planMobileClsReplay(routes,config);
 assert.ok(p.routes.some(x=>x.startsWith('/en/blog/')));
 assert.ok(p.routes.some(x=>x.startsWith('/blog/')));
 assert.deepEqual(p.modes,['isolated','parallel']);
 assert.ok(p.rounds>=2 && p.expected<=24);
 assert.equal(p.maxCls,0.100);
});
test('any distinct cold load over 0.100 fails, even with healthy average',()=>{
 const p=planMobileClsReplay(routes,config),rec=make(p);
 rec[1].cls=0.10081;
 const report=summarizeMobileClsReplay(p,rec);
 assert.equal(report.healthy,false);
 assert.equal(report.failures.length,1);
 assert.equal(report.failures[0].cls,0.10081);
 assert.ok(report.groups.some(x=>x.failed));
});
test('invalid, missing and duplicate samples cannot produce green',()=>{
 const p=planMobileClsReplay(routes,config),rec=make(p);
 assert.throws(()=>summarizeMobileClsReplay(p,rec.slice(1)),/INCOMPLETE/);
 rec[2].cls=null;
 assert.equal(summarizeMobileClsReplay(p,rec).healthy,false);
 const duplicate=make(p);
 duplicate[2]={...duplicate[1]};
 assert.throws(()=>summarizeMobileClsReplay(p,duplicate),/DUPLICATE/);
});
test('sampling cannot hide sitemap removal or weaken the gate',()=>{
 assert.equal(MOBILE_CLS_LIMIT,0.100);
 assert.throws(()=>planMobileClsReplay(routes.slice(1),config),/ROUTES_MISSING/);
 assert.throws(()=>planMobileClsReplay(routes,{...config,max_cls:0.2}),/THRESHOLD_CHANGE_FORBIDDEN/);
 assert.throws(()=>planMobileClsReplay(routes,{...config,samples_per_route:1}),/ROUNDS_INVALID/);
 assert.throws(()=>planMobileClsReplay(routes,{...config,max_total_checks:999}),/BUDGET_INVALID/);
});
test('existing scheduler and full sitemap remain authoritative, extra replay adds no runner',()=>{
 const src=readFileSync('tools/site-shell/website-cross-browser-assurance.mjs','utf8');
 const flow=readFileSync('.github/workflows/website-cross-browser-screenshot-assurance.yml','utf8');
 assert.match(src,/const routes=await readRoutes\(\)/);
 assert.match(src,/const mobileClsRepeatability=await replayMobileClsForDailyProduction\(\)/);
 assert.match(src,/if\(process\.env\.ASSURANCE_MODE!=='daily'\) return null/);
 assert.match(src,/checkOne\(\{/);
 assert.match(src,/if\(result\.violations\.length\) failures\.push\(result\)/);
 assert.match(src,/summarizeMobileClsReplay\(plan,records\)/);
 assert.match(src,/mobileClsRepeatability/);
 assert.match(src,/Math\.min\(6,Math\.max\(1,Number\(process\.env\.ASSURANCE_WORKERS\|\|6\)\)\)/);
 assert.match(flow,/schedule:/);
 assert.match(flow,/cron: '20 6 \* \* \*'/);
 assert.match(flow,/node tools\/site-shell\/website-cross-browser-assurance\.mjs/);
 assert.match(flow,/retention-days: 30/);
});
